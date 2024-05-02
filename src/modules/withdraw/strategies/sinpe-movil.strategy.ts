import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { DynamicDtoValidator } from 'src/common/dto_validators/dynamic.validator';
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
import { SlackChannel } from 'src/services/slack/enums/slack-channels.enum';
import { SlackEmoji } from 'src/services/slack/enums/slack-emoji.enum';
import { SlackWebhooks } from 'src/services/slack/enums/slack-webhooks.enum';
import { SlackService } from 'src/services/slack/slack.service';
import { createTransactionsTemplate } from 'src/services/slack/templates/transactions.template';
import { EntityManager } from 'typeorm';
import { SinpeMovilWithdrawDto } from '../dtos/sinpe-movil.withdraw.dto';
import { WithdrawDto } from '../dtos/withdraw.dto';
import { WithdrawalMethodEnum } from '../enums/withdrawalMethod.enum';
import { RefundSinpePayload } from './sinpe.strategy';
import { Withdraw } from './withdraw';
import { UpdateBalanceTransferType } from 'src/modules/balance-updater/enums/type.enum';
import { UpdateBalance } from 'src/modules/balance-updater/interfaces/updateBalance';
import { BalanceUpdaterService } from 'src/modules/balance-updater/balance-updater.service';
import { RidiviStatusTransaction } from 'src/services/ridivi/interfaces/ridivi-status-transaction';
import { TransactionDetail } from 'src/entities/transaction.detail.entity';

export class SinpeMobileWithdraw implements Withdraw {
    private coin!: Coin;
    private methodDto!: SinpeMovilWithdrawDto;

    constructor(
        private body: WithdrawDto,
        private manager: EntityManager,
        private user: User,
        private ridiviService: RidiviService,
        private pushNotificationService: PushNotificationService,
        private withdrawMethod: WithdrawalMethod,
        private googleCloudTaskService: GoogleCloudTasksService,
    ) {}

    /**
     * This section is dedicated to explaining the logic behind fee calculations for a SINPE Mobile withdrawal.
     *
     * The fee calculation involves several steps and conditions:
     *
     * 1. **Base Fee Calculation**:
     *    - A base fee is calculated as a percentage of the amount to withdraw. This is determined by multiplying the withdrawal amount by a fee rate (0.01 or 1%).
     *    - The result is then rounded to two decimal places to ensure precision.
     *
     * 2. **Threshold Check for Additional Fees**:
     *    - If the amount to withdraw is greater than or equal to 200,000 colones, an additional fee is applied. This is known as the Sinpe Fee.
     *    - The Sinpe Fee is calculated by multiplying $0.80 USD by the coin's exchange rate to convert it into the coin's equivalent value.
     *
     * 3. **Total Fee Calculation**:
     *    - The total fee is the sum of the base fee and any additional Sinpe Fee (if applicable).
     *
     * 4. **Osmo Fee Calculation**:
     *    - The Osmo Fee is calculated by subtracting the Sinpe Fee from the total fee. This represents the fee retained by Osmo.
     *
     * 5. **Total Amount to Debit**:
     *    - The total amount to debit from the user's account includes the original withdrawal amount plus the total fee.
     *
     * This calculation ensures that the fees are transparently and accurately applied to each withdrawal transaction.
     */
    async withdraw(): Promise<any> {
        await this.validateInputData();
        const rate = new Decimal(this.coin.exchangeRate);
        const amountToWithdraw = new Decimal(this.body.amount);
        let fee = new Decimal(0);
        const thresholdAmount = new Decimal(200000); // All transactions under 200k colones have not fee,ptherwise fee is $1.50 USD (SINPE)
        const feeRate = new Decimal(this.withdrawMethod.fee);
        let sinpeFee = new Decimal(0);
        fee = amountToWithdraw.times(feeRate);
        fee = new Decimal(fee.toFixed(2));
        if (amountToWithdraw.greaterThanOrEqualTo(thresholdAmount)) {
            sinpeFee = new Decimal(0.8).times(rate); // $0.80 Solfin fee
        }
        const osmoFee = new Decimal(fee).minus(sinpeFee).toNumber();
        const amountToUserDebit = new Decimal(this.body.amount).plus(fee).toNumber();
        //console.log(`Payload:`, payload);
        console.log(`BCCR Rate:`, rate);
        console.log(`Rate:`, rate.toString());
        console.log(`Amount to Withdraw:`, amountToWithdraw.toString());
        console.log(`Fee:`, fee.toString());
        console.log(`Threshold Amount:`, thresholdAmount.toString());
        console.log(`Fee Rate:`, feeRate.toString());
        console.log(`Sinpe Fee:`, sinpeFee);
        console.log(`Osmo Fee:`, osmoFee.toString());
        console.log(`Amount to User Debit:`, amountToUserDebit);
        let transactionGroup: TransactionGroup | undefined;
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet, osmoFeeWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, userId: this.user.id }),
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, alias: MainWalletsAccount.FEES }),
            ]);
            if (!userWallet || !osmoFeeWallet) throw new BadRequestException('Wallets not found');

            if (userWallet.availableBalance < this.body.amount) throw new BadRequestException('Insufficient balance');
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
                status: Status.COMPLETED,
                type: TransactionType.WITHDRAW,
                method: TransactionMethodEnum.SINPE_MOBILE,
                partner: Partner.RIDIVI,
                fromUser: { id: this.user.id },
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
            const osmoFeeTransaction = entityManager.create(Transaction, {
                subtype: TransactionSubtype.FEE_WITHDRAW,
                amount: osmoFee,
                balance: osmoFeeWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: osmoFeeWallet,
            });
            await entityManager.insert(Transaction, [userTransaction, osmoFeeTransaction]);
            const osmoTransactionFee = entityManager.create(TransactionFee, {
                amount: osmoFee,
                coin: this.coin,
                transactionGroup: transactionGroup,
            });
            const sinpeTransactionFee = entityManager.create(TransactionFee, {
                amount: sinpeFee.toNumber(),
                coin: this.coin,
                transactionGroup: transactionGroup,
            });
            await entityManager.insert(TransactionFee, [osmoTransactionFee, sinpeTransactionFee]);
            const transactionDetail = entityManager.create(TransactionDetail, {
                address: this.methodDto.phoneNumber,
                transaction: { id: userTransaction.id },
            });
            await entityManager.insert(TransactionDetail, transactionDetail);
        });
        if (transactionGroup && this.user)
            this.ridiviService
                .sendSinpeMovil({
                    amount: this.body.amount,
                    phoneNumber: this.methodDto.phoneNumber,
                    userId: this.user.id,
                    transactionGroupId: transactionGroup.id,
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
                    name: WithdrawalMethodEnum.SINPE_MOBILE,
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
            console.log(data.transactionGroupId);
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
        this.methodDto = await DynamicDtoValidator.validateInputData(this.body.data, SinpeMovilWithdrawDto);
        const coin = await this.manager.findOneBy(Coin, { id: this.body.coinId });
        if (!coin) throw new BadRequestException('Invalid coin');
        this.coin = coin;
    }
}
