import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { DynamicDtoValidator } from 'src/common/dto_validators/dynamic.validator';
import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionMethodEnum } from 'src/common/enums/transactionMethod.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { Coin } from 'src/entities/coin.entity';
import { FundingTransactionLimit } from 'src/entities/fundingTransactionLimits.entity';
import { TierFunding } from 'src/entities/tierFunding.entity';
import { TierUser } from 'src/entities/tierUser.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { SlackChannel } from 'src/services/slack/enums/slack-channels.enum';
import { SlackEmoji } from 'src/services/slack/enums/slack-emoji.enum';
import { SlackWebhooks } from 'src/services/slack/enums/slack-webhooks.enum';
import { SlackService } from 'src/services/slack/slack.service';
import { createTransactionsTemplate } from 'src/services/slack/templates/transactions.template';
import { EntityManager } from 'typeorm';
import { FundingDto } from '../dtos/funding.dto';
import { SinpeFundingDto } from '../dtos/solfin.dto';
import { FundingMethodEnum } from '../enums/fundingMethod.enum';
import { Funding } from './funding';
import { RidiviService } from 'src/services/ridivi/ridivi.service';
import { RidiviCurrency } from 'src/services/ridivi/enums/currency.enum';
import { RidiviStatusTransaction } from 'src/services/ridivi/interfaces/ridivi-status-transaction';
import { RefundSinpePayload } from 'src/modules/withdraw/strategies/sinpe.strategy';
import { PushNotificationService } from 'src/modules/push-notification/push-notification.service';
import { RidiviStrategy } from 'src/services/ridivi/interfaces/strategy';
import { RidiviWebhookPayload } from 'src/services/ridivi/interfaces/webhook-payload';
import { formatAmount } from 'src/common/utils/amount-formatter.util';
import { TransactionDetail } from 'src/entities/transaction.detail.entity';
import { RidiviExternalTransferType } from 'src/services/ridivi/enums/transfer-type.enum';

export class SinpeFunding implements Funding, RidiviStrategy {
    private coin!: Coin;
    private methodDto!: SinpeFundingDto;
    constructor(
        private manager: EntityManager,
        private pushNotificationService?: PushNotificationService,
        private ridiviService?: RidiviService,
        private body?: FundingDto | undefined,
        private user?: User,
    ) {}

    async fund(): Promise<void> {
        await this.validateInputData();
        if (!this.body) throw new BadRequestException('Data has not been provided');
        if (!this.user) throw new BadRequestException('User has not been provided');
        const amountToReceive = this.body.amount;
        let transactionGroup: TransactionGroup | undefined;
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, userId: this.user?.id }),
            ]);
            if (!userWallet) throw new BadRequestException('No se encontró la billetera del usuario');

            const newBalance = Decimal.add(userWallet.balance, amountToReceive).toNumber();
            await entityManager.update(Wallet, userWallet.id, { balance: newBalance });
            transactionGroup = entityManager.create(TransactionGroup, {
                status: Status.PENDING,
                type: TransactionType.FUNDING,
                fromUser: { id: this.user?.id },
                transactionCoin: this.coin,
                partner: Partner.RIDIVI,
                method: TransactionMethodEnum.CASH_IN,
            });
            await entityManager.insert(TransactionGroup, transactionGroup);
            const userTransaction = entityManager.create(Transaction, {
                subtype: TransactionSubtype.CREDIT_FIAT_FUNDING,
                amount: new Decimal(amountToReceive).toNumber(),
                balance: userWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: userWallet,
            });

            const fundingTransactionLimit = await entityManager.findOne(FundingTransactionLimit, {
                where: {
                    user: { id: this.user?.id },
                    fundingmethod: { id: this.body?.fundingMethodId },
                },
            });
            if (!fundingTransactionLimit) throw new BadRequestException('No se encontró el limite de transacción');

            fundingTransactionLimit.dailyAmassedAmount += new Decimal(amountToReceive).toNumber();
            fundingTransactionLimit.monthlyAmassedAmount += new Decimal(amountToReceive).toNumber();

            await entityManager.save(fundingTransactionLimit);

            await Promise.all([entityManager.insert(Transaction, [userTransaction])]);
        });
        if (transactionGroup) {
            this.ridiviService
                ?.createExternalTransfer({
                    amount: this.body.amount,
                    currency: RidiviCurrency[this.coin.acronym as keyof typeof RidiviCurrency],
                    iban: this.methodDto.iban,
                    transactionGroupId: transactionGroup.id,
                    type: RidiviExternalTransferType.DTR,
                    userId: this.user?.id,
                })
                .catch((error) =>
                    this.refundTransaction({
                        amount: this.body?.amount ?? 0,
                        error: error.toString(),
                        fee: 0,
                        transactionGroupId: transactionGroup?.id ?? '',
                        userId: this.user?.id ?? '',
                        coinId: this.coin.id,
                    }),
                );
        }
    }

    /// Handles the update of a transaction based on the new status received from Ridivi, invoking either completeTransaction or refundTransaction accordingly.
    async updateTransaction(data: RidiviStatusTransaction) {
        const transactionGroup = await this.manager.findOne(TransactionGroup, {
            relations: { transactions: true, transactionCoin: true, fromUser: true },
        });
        if (!transactionGroup) throw new BadRequestException('Invalid transaction');
        const userAmount = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.CREDIT_FIAT_FUNDING)?.amount ?? 0;

        if (data.status == Status.FAILED) {
            return this.refundTransaction({
                amount: userAmount,
                error: 'Transaction Failed',
                fee: 0,
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
        const userAmount = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.CREDIT_FIAT_FUNDING)?.amount ?? 0;
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet] = await Promise.all([
                findAndLockWallet({
                    entityManager: entityManager,
                    coinId: transactionGroup.transactionCoin.id,
                    userId: transactionGroup.fromUser.id,
                }),
            ]);
            if (!userWallet) throw new BadRequestException('No se encontró la billetera del usuario');
            const newBalance = Decimal.add(userWallet.availableBalance, userAmount).toNumber();
            await entityManager.update(Wallet, userWallet.id, { availableBalance: newBalance });
            await entityManager.update(TransactionGroup, transactionGroup.id, { status: Status.COMPLETED });
        });
        SlackService.notifyTransaction({
            baseURL: SlackWebhooks.OSMO_FUNDING,
            data: createTransactionsTemplate({
                channel: SlackChannel.OSMO_FUNDING,
                amount: this.body?.amount ?? 0,
                coin: CoinEnum[transactionGroup.transactionCoin.acronym as keyof typeof CoinEnum],
                firstName: this.user?.firstName ?? '',
                lastName: this.user?.lastName ?? '',
                email: this.user?.email ?? '',
                transactionType: {
                    name: FundingMethodEnum.TRANSFER_SINPE,
                    emoji: SlackEmoji.FLAG_CR,
                },
                attachmentUrl:
                    'https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98',
            }),
        });
    }

    private async refundTransaction(data: RefundSinpePayload) {
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: data.coinId, userId: data.userId }),
            ]);

            if (!userWallet) throw new BadRequestException('Wallets not found');

            await Promise.all([
                entityManager.update(Wallet, userWallet.id, {
                    balance: new Decimal(userWallet.balance).minus(data.amount).toNumber(),
                }),
                entityManager.update(TransactionGroup, data.transactionGroupId, { status: Status.FAILED }),
            ]);
        });
    }

    private async validateInputData() {
        if (!this.body || !this.body.data) throw new BadRequestException('No se encontraron los datos de la transacción');

        this.methodDto = await DynamicDtoValidator.validateInputData(this.body.data, SinpeFundingDto);

        const coin = await this.manager.findOneBy(Coin, { id: this.body.coinId });
        if (!coin) throw new BadRequestException('Invalid coin');
        if (!Object.values(RidiviCurrency).includes(coin.acronym as RidiviCurrency)) throw new BadRequestException('Invalid coin');
        this.coin = coin;

        const [fundingTransactionLimit, tierUser] = await Promise.all([
            this.manager.findOne(FundingTransactionLimit, {
                where: {
                    user: { id: this.user?.id },
                    fundingmethod: { id: this.body.fundingMethodId },
                },
            }),
            this.manager.findOne(TierUser, {
                where: {
                    user: {
                        id: this.user?.id,
                    },
                },
            }),
        ]);
        if (!fundingTransactionLimit || !tierUser) throw new BadRequestException('No se encontraron los limites de transacción');

        const dailyAmountToAmass = fundingTransactionLimit.dailyAmassedAmount + this.body.amount / this.coin.exchangeRate;
        const monthlyAmountToAmass = fundingTransactionLimit.monthlyAmassedAmount + this.body.amount / this.coin.exchangeRate;

        const tierFunding = await this.manager.findOne(TierFunding, {
            where: {
                fundingMethod: { id: this.body.fundingMethodId },
                tier: tierUser.tier,
            },
        });
        if (!tierFunding) throw new BadRequestException('No se encontro el tier de funding');

        if (this.body.amount > tierFunding.max) throw new BadRequestException('Este monto excede el maximo permitido por transacción');
        if (this.body.amount < tierFunding.min) throw new BadRequestException('Este monto no alcanza el minimo permitido por transacción');
        if (dailyAmountToAmass > tierFunding.dailyLimit) throw new BadRequestException('Alcanzaste tu limite diario');
        if (monthlyAmountToAmass > tierFunding.monthlyLimit) throw new BadRequestException('Alcanzaste tu limite mensual');
    }

    async createIncomingTransaction(data: RidiviWebhookPayload, userId: string): Promise<string | null> {
        const coin = await this.manager.findOneBy(Coin, { acronym: data.currency });
        if (!coin) throw new BadRequestException('Invalid coin');
        let transactionGroup: TransactionGroup | undefined;
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet] = await Promise.all([findAndLockWallet({ entityManager: entityManager, coinId: coin.id, userId: userId })]);
            const amountToReceive = new Decimal(data.amount);
            if (!userWallet) throw new BadRequestException('No se encontró la billetera del usuario');
            const newAvailableBalance = Decimal.add(userWallet.availableBalance, amountToReceive).toNumber();
            const newBalance = Decimal.add(userWallet.balance, amountToReceive).toNumber();
            await entityManager.update(Wallet, userWallet.id, { availableBalance: newAvailableBalance, balance: newBalance });
            transactionGroup = entityManager.create(TransactionGroup, {
                status: Status.COMPLETED,
                type: TransactionType.RECEPTION,
                toUser: { id: userId },
                transactionCoin: coin,
                partner: Partner.RIDIVI,
                note: data.description,
                metadata: {
                    description: data.description,
                    ...data.origin,
                },
            });
            await entityManager.insert(TransactionGroup, transactionGroup);
            const userTransaction = entityManager.create(Transaction, {
                subtype: TransactionSubtype.CREDIT_FIAT_TRANSFER,
                amount: new Decimal(amountToReceive).toNumber(),
                balance: userWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: userWallet,
            });

            await Promise.all([entityManager.insert(Transaction, [userTransaction])]);
            const transactionDetail = entityManager.create(TransactionDetail, {
                address: data.origin.iban,
                transaction: { id: userTransaction.id },
            });
            await entityManager.insert(TransactionDetail, transactionDetail);
        });
        this.pushNotificationService?.sendPush(userId, {
            title: `Recibiste`,
            message: `Has recibido ${formatAmount(data.amount)}${data.currency}`,
        });
        return transactionGroup?.id ?? null;
    }
}
