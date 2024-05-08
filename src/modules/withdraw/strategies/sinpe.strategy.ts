import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { DynamicDtoValidator } from 'src/common/dto_validators/dynamic.validator';
import { FeeSource } from 'src/common/enums/fee-source.enum';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionMethodEnum } from 'src/common/enums/transactionMethod.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { Coin } from 'src/entities/coin.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionFee } from 'src/entities/transactionFee.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { WithdrawalMethod } from 'src/entities/withdrawalMethod.entity';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { PushNotificationService } from 'src/modules/push-notification/push-notification.service';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { RidiviService } from 'src/services/ridivi/ridivi.service';
import { EntityManager } from 'typeorm';
import { SinpeWithdrawDto } from '../dtos/sinpe.withdraw.dto';
import { WithdrawDto } from '../dtos/withdraw.dto';
import { Withdraw } from './withdraw';
import { RidiviStatusTransaction } from 'src/services/ridivi/interfaces/ridivi-status-transaction';
import { UpdateBalance } from 'src/modules/balance-updater/interfaces/updateBalance';
import { UpdateBalanceTransferType } from 'src/modules/balance-updater/enums/type.enum';
import { BalanceUpdaterService } from 'src/modules/balance-updater/balance-updater.service';
import { SlackService } from 'src/services/slack/slack.service';
import { createTransactionsTemplate } from 'src/services/slack/templates/transactions.template';
import { SlackChannel } from 'src/services/slack/enums/slack-channels.enum';
import { SlackWebhooks } from 'src/services/slack/enums/slack-webhooks.enum';
import { WithdrawalMethodEnum } from '../enums/withdrawalMethod.enum';
import { SlackEmoji } from 'src/services/slack/enums/slack-emoji.enum';
import { RidiviExternalTransferType } from 'src/services/ridivi/enums/transfer-type.enum';
import { RidiviCurrency } from 'src/services/ridivi/enums/currency.enum';
import { RidiviStrategy } from 'src/services/ridivi/interfaces/strategy';

export interface RefundSinpePayload {
    amount: number;
    fee: number;
    userId: string;
    error: any;
    transactionGroupId: string;
    coinId: string;
}
export class SinpeWithdraw implements Withdraw, RidiviStrategy {
    private coin!: Coin;
    private methodDto!: SinpeWithdrawDto;

    constructor(
        private manager: EntityManager,
        private googleCloudTaskService: GoogleCloudTasksService,
        private pushNotificationService: PushNotificationService,
        private user?: User,
        private body?: WithdrawDto,
        private ridiviService?: RidiviService,
        private withdrawMethod?: WithdrawalMethod,
    ) {}

    async withdraw(): Promise<any> {
        await this.validateInputData();
        if (!this.body) throw new BadRequestException('Data not provided');
        if (!this.withdrawMethod) throw new BadRequestException('Withdraw method not provided');
        const rate = this.coin.acronym == CoinEnum.USD ? new Decimal(1) : new Decimal(this.coin.exchangeRate);
        const amountToWithdraw = new Decimal(this.body.amount);
        let fee = new Decimal(0);
        const thresholdAmount = new Decimal(100);
        const feeRate = new Decimal(this.withdrawMethod.fee);
        const isCRC = this.coin.acronym === CoinEnum.CRC;
        const adjustedAmount = isCRC ? amountToWithdraw.dividedBy(this.coin.exchangeRate) : amountToWithdraw;

        fee = adjustedAmount.greaterThan(thresholdAmount) ? adjustedAmount.times(feeRate) : new Decimal(rate);
        fee = new Decimal(fee.toFixed(2));
        const sinpeFee = new Decimal(0.8).toNumber(); // $0.80 Solfin fee
        const osmoFee = new Decimal(fee).minus(sinpeFee).toNumber();
        const amountToUserDebit = new Decimal(this.body.amount).plus(fee).toNumber();
        //console.log(`Payload:`, payload);
        console.log(`BCCR Rate:`, this.coin.exchangeRate);
        console.log(`Rate:`, rate.toString());
        console.log(`Amount to Withdraw:`, amountToWithdraw.toString());
        console.log(`Fee:`, fee.toString());
        console.log(`Threshold Amount:`, thresholdAmount.toString());
        console.log(`Fee Rate:`, feeRate.toString());
        console.log(`Is CRC:`, isCRC);
        console.log(`Adjusted Amount:`, adjustedAmount.toString());
        console.log(`Sinpe Fee:`, sinpeFee);
        console.log(`Osmo Fee:`, osmoFee.toString());
        console.log(`Amount to User Debit:`, amountToUserDebit);
        let transactionGroup: TransactionGroup | undefined;
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet, osmoFeeWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, userId: this.user?.id }),
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, alias: MainWalletsAccount.FEES }),
            ]);

            if (!userWallet || !osmoFeeWallet) throw new BadRequestException('Wallets not found');
            if (new Decimal(amountToUserDebit).greaterThan(userWallet.availableBalance))
                throw new BadRequestException('Insufficient balance');
            await Promise.all([
                entityManager.update(Wallet, userWallet.id, {
                    availableBalance: new Decimal(userWallet.availableBalance).minus(amountToUserDebit).toNumber(),
                    balance: new Decimal(userWallet.balance).minus(amountToUserDebit).toNumber(),
                }),
                entityManager.update(Wallet, osmoFeeWallet.id, {
                    availableBalance: new Decimal(osmoFeeWallet.availableBalance).plus(osmoFee).toNumber(),
                    balance: new Decimal(osmoFeeWallet.balance).plus(osmoFee).toNumber(),
                }),
            ]);

            transactionGroup = entityManager.create(TransactionGroup, {
                status: Status.PENDING,
                type: TransactionType.WITHDRAW,
                method: TransactionMethodEnum.SINPE,
                partner: Partner.RIDIVI,
                fromUser: { id: this.user?.id },
                transactionCoin: { id: this.coin.id },
            });
            await entityManager.insert(TransactionGroup, transactionGroup);
            const userTransaction = entityManager.create(Transaction, {
                subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW,
                amount: amountToUserDebit,
                balance: userWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: userWallet,
            });
            const osmoFeeWalletTransaction = entityManager.create(Transaction, {
                subtype: TransactionSubtype.FEE_WITHDRAW,
                amount: osmoFee,
                balance: osmoFeeWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: osmoFeeWallet,
            });

            await entityManager.insert(Transaction, [userTransaction, osmoFeeWalletTransaction]);
            const sinpeFeeTransaction = entityManager.create(TransactionFee, {
                amount: sinpeFee,
                coin: { id: this.coin.id },
                transactionGroup: { id: transactionGroup.id },
                source: FeeSource.RIDIVI,
            });
            const osmoFeeTransaction = entityManager.create(TransactionFee, {
                amount: osmoFee,
                coin: { id: this.coin.id },
                transactionGroup: { id: transactionGroup.id },
                source: FeeSource.OSMO,
            });
            await entityManager.insert(TransactionFee, [sinpeFeeTransaction, osmoFeeTransaction]);
        });
        if (transactionGroup && this.user) {
            this.ridiviService
                ?.createExternalTransfer({
                    amount: this.body.amount,
                    currency: RidiviCurrency[this.coin.acronym as keyof typeof RidiviCurrency],
                    iban: this.methodDto.iban,
                    transactionGroupId: transactionGroup.id,
                    type: RidiviExternalTransferType.TFT,
                    userId: this.user?.id,
                })
                .catch((error) =>
                    this.refundTransaction({
                        amount: amountToUserDebit,
                        error: error.toString(),
                        fee: osmoFee,
                        transactionGroupId: transactionGroup?.id ?? '',
                        userId: this.user?.id ?? '',
                        coinId: this.coin.id,
                    }),
                );
        }
    }

    async updateTransaction(data: RidiviStatusTransaction) {
        const transactionGroup = await this.manager.findOne(TransactionGroup, {
            relations: { transactions: true, transactionCoin: true, fromUser: true },
            where: {
                id: data.transactionGroupId,
            },
        });
        if (!transactionGroup) throw new BadRequestException('Invalid transaction');
        const userAmount = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.DEBIT_FIAT_WITHDRAW)?.amount ?? 0;
        const osmoFeeAmount = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.FEE_WITHDRAW)?.amount ?? 0;
        if (data.status == Status.FAILED) {
            return this.refundTransaction({
                amount: userAmount,
                error: data.error,
                fee: osmoFeeAmount,
                transactionGroupId: data.transactionGroupId,
                userId: transactionGroup?.fromUser.id,
                coinId: transactionGroup.transactionCoin.id,
            });
        }
        if (data.status == Status.COMPLETED) {
            return this.completeTransaction(transactionGroup);
        }
    }

    private async completeTransaction(transactionGroup: TransactionGroup) {
        await this.manager.update(TransactionGroup, transactionGroup.id, { status: Status.COMPLETED });
        const osmoFeeAmount = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.FEE_WITHDRAW)?.amount ?? 0;
        const updateFeePayload: UpdateBalance = {
            amount: osmoFeeAmount,
            coinId: transactionGroup.transactionCoin.id,
            type: UpdateBalanceTransferType.USER_TO_OSMO,
            userId: transactionGroup.fromUser.id,
        };
        this.googleCloudTaskService.createInternalTask(BalanceUpdaterService.queue, updateFeePayload, BalanceUpdaterService.url);
        SlackService.notifyTransaction({
            baseURL: SlackWebhooks.OSMO_WITHDRAW,
            data: createTransactionsTemplate({
                channel: SlackChannel.OSMO_WITHDRAW,
                amount: this.body?.amount ?? 0,
                coin: CoinEnum[transactionGroup.transactionCoin.acronym as keyof typeof CoinEnum],
                firstName: this.user?.firstName ?? '',
                lastName: this.user?.lastName ?? '',
                email: this.user?.email ?? '',
                transactionType: {
                    name: WithdrawalMethodEnum.SINPE,
                    emoji: SlackEmoji.FLAG_CR,
                },
                attachmentUrl:
                    'https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98',
            }),
        });
    }

    private async refundTransaction(data: RefundSinpePayload) {
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet, osmoFeeWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: data.coinId, userId: data.userId }),
                findAndLockWallet({ entityManager: entityManager, coinId: data.coinId, alias: MainWalletsAccount.FEES }),
            ]);
            if (!userWallet || !osmoFeeWallet) throw new BadRequestException('Wallets not found');

            await Promise.all([
                entityManager.update(Wallet, userWallet.id, {
                    availableBalance: new Decimal(userWallet.availableBalance).plus(data.amount).toNumber(),
                    balance: new Decimal(userWallet.balance).plus(data.amount).toNumber(),
                }),
                entityManager.update(Wallet, osmoFeeWallet.id, {
                    availableBalance: new Decimal(osmoFeeWallet.availableBalance).minus(data.fee).toNumber(),
                    balance: new Decimal(osmoFeeWallet.balance).minus(data.fee).toNumber(),
                }),
                entityManager.update(TransactionGroup, data.transactionGroupId, { status: Status.FAILED }),
            ]);
        });
        const errorMessage = `Your SINPE Transaction could not be completed. ${data.error}`;
        console.log(errorMessage);
        this.pushNotificationService.sendPush(data.userId, {
            message: errorMessage,
            title: 'Transaction Failed',
        });
    }

    private async validateInputData() {
        if (!this.body || !this.body.data) throw new BadRequestException('No se encontraron los datos de la transacción');
        this.methodDto = await DynamicDtoValidator.validateInputData(this.body.data, SinpeWithdrawDto);
        const coin = await this.manager.findOneBy(Coin, { id: this.body?.coinId });
        if (!coin) throw new BadRequestException('Invalid coin');
        this.coin = coin;
    }
}
