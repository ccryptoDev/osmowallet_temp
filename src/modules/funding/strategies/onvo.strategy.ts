import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ValidatorData } from 'src/common/dto_validators/validator-data';
import { FeeSource } from 'src/common/enums/fee-source.enum';
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
import { TransactionFee } from 'src/entities/transactionFee.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { BalanceUpdaterService } from 'src/modules/balance-updater/balance-updater.service';
import { UpdateBalanceTransferType } from 'src/modules/balance-updater/enums/type.enum';
import { UpdateBalance } from 'src/modules/balance-updater/interfaces/updateBalance';
import { CardService } from 'src/modules/card/card.service';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { SlackChannel } from 'src/services/slack/enums/slack-channels.enum';
import { SlackEmoji } from 'src/services/slack/enums/slack-emoji.enum';
import { SlackWebhooks } from 'src/services/slack/enums/slack-webhooks.enum';
import { SlackService } from 'src/services/slack/slack.service';
import { createTransactionsTemplate } from 'src/services/slack/templates/transactions.template';
import { EntityManager } from 'typeorm';
import { FundingDto } from '../dtos/funding.dto';
import { OnvoFundingDto } from '../dtos/onvo.dto';
import { FundingMethodEnum } from '../enums/fundingMethod.enum';
import { OnvoCheckoutSuccess } from '../interfaces/onvo.checkout.success';
import { Funding } from './funding';
import { exchangeCoinToUSD } from 'src/common/utils/exchanger.util';

export class OnvoFunding implements Funding {
    private coin!: Coin;
    private fee!: number;
    constructor(
        private user: User,
        private manager: EntityManager,
        private googleCloudTaskService: GoogleCloudTasksService,
        private onvoBody?: OnvoCheckoutSuccess,
        private cardService?: CardService,
        private body?: FundingDto,
    ) {}

    async fund() {
        if (!this.body || !this.body.data) throw new BadRequestException('No se encontraron los datos de la transacción');

        const data: OnvoFundingDto = await ValidatorData.validate<OnvoFundingDto>(this.body.data, OnvoFundingDto);
        await this.validate();
        await this.cardService?.pay(this.user.id, this.body.amount, data.paymentMethodId);
    }

    async pay(): Promise<any> {
        if (!this.onvoBody) throw new BadRequestException('No se encontraron los datos de la transacción');
        await this.setData();

        const totalAmount = new Decimal(this.onvoBody.data.amount).div(100);
        const denominatorFee = new Decimal(this.fee).add(1);
        const amountToReceive = new Decimal(new Decimal(totalAmount).sub(0.25).div(denominatorFee).toFixed(2)).toNumber();
        const totalFee = new Decimal(new Decimal(totalAmount).sub(amountToReceive).toFixed(2)).toNumber();
        console.log('totalAmount', totalAmount);
        console.log('amountToReceive', denominatorFee);
        console.log('amountToReceive', amountToReceive);
        console.log('totalFee', totalFee);
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, userId: this.user.id }),
            ]);
            if (!userWallet) throw new BadRequestException('No se encontraron las billeteras necesarias para realizar la transacción');
            const updatedAvailableBalance = Decimal.add(userWallet.availableBalance, amountToReceive).toNumber();
            const updatedBalance = Decimal.add(userWallet.balance, amountToReceive).toNumber();

            await entityManager.update(Wallet, userWallet.id, { availableBalance: updatedAvailableBalance, balance: updatedBalance });
            const transactionGroup = entityManager.create(TransactionGroup, {
                status: Status.COMPLETED,
                type: TransactionType.FUNDING,
                fromUser: { id: this.user.id },
                transactionCoin: this.coin,
                partner: Partner.ONVO,
                method: TransactionMethodEnum.CREDIT_CARD,
            });
            await entityManager.insert(TransactionGroup, transactionGroup);
            const userTransaction = entityManager.create(Transaction, {
                subtype: TransactionSubtype.CREDIT_FIAT_FUNDING,
                amount: new Decimal(amountToReceive).toNumber(),
                balance: userWallet.availableBalance,
                transactionGroup: transactionGroup,
                wallet: userWallet,
            });

            const feeRecord = entityManager.create(TransactionFee, {
                amount: totalFee,
                coin: this.coin,
                transactionGroup: transactionGroup,
                source: FeeSource.ONVO,
            });
            await Promise.all([entityManager.insert(Transaction, [userTransaction]), entityManager.insert(TransactionFee, feeRecord)]);

            const fundingTransactionLimit = await entityManager.findOne(FundingTransactionLimit, {
                where: {
                    user: { id: this.user.id },
                    fundingmethod: { name: TransactionMethodEnum.CREDIT_CARD },
                },
            });
            if (!fundingTransactionLimit) throw new BadRequestException('No se encontro el limite de transacción');

            fundingTransactionLimit.dailyAmassedAmount += new Decimal(amountToReceive).toNumber();
            fundingTransactionLimit.monthlyAmassedAmount += new Decimal(amountToReceive).toNumber();

            await entityManager.save(fundingTransactionLimit);
        });

        SlackService.notifyTransaction({
            baseURL: SlackWebhooks.FUNDING_CARD,
            data: createTransactionsTemplate({
                channel: SlackChannel.FUNDING_CARD,
                amount: totalAmount.toNumber(),
                coin: CoinEnum[this.coin.acronym as keyof typeof CoinEnum],
                firstName: this.user.firstName,
                lastName: this.user.lastName,
                email: this.user.email,
                transactionType: {
                    name: FundingMethodEnum.CREDIT_CARD,
                    emoji: SlackEmoji.CREDIT_CARD,
                },
                attachmentUrl:
                    'https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98',
            }),
        });
        const payload: UpdateBalance = {
            amount: amountToReceive,
            coinId: this.coin.id,
            type: UpdateBalanceTransferType.OSMO_TO_USER,
            userId: this.user.id,
        };
        this.googleCloudTaskService.createInternalTask(BalanceUpdaterService.queue, payload, BalanceUpdaterService.url);
    }

    private async setData(): Promise<TierFunding> {
        const [coin, tierUser] = await Promise.all([
            this.manager.findOneBy(Coin, { acronym: 'USD' }),
            this.manager.findOne(TierUser, {
                relations: { tier: true },
                where: { user: { id: this.user.id } },
            }),
        ]);
        if (!coin) throw new BadRequestException('Invalid coin');
        this.coin = coin;

        if (!tierUser) throw new BadRequestException('Invalid tier');

        const tierFunding = await this.manager.findOne(TierFunding, {
            where: {
                fundingMethod: { name: TransactionMethodEnum.CREDIT_CARD },
                tier: { id: tierUser.tier.id },
            },
        });
        if (!tierFunding) throw new BadRequestException('Invalid tier funding');
        this.fee = tierFunding.fee;
        return tierFunding;
    }

    private async validate() {
        if (!this.body || !this.body.data) throw new BadRequestException('No se encontraron los datos de la transacción');

        const tierFunding = await this.setData();
        const fundingTransactionLimit = await this.manager.findOne(FundingTransactionLimit, {
            where: {
                user: { id: this.user.id },
                fundingmethod: { name: TransactionMethodEnum.CREDIT_CARD },
            },
        });
        if (!fundingTransactionLimit) throw new BadRequestException('No se encontro el limite de transacción');

        const usdAmount = exchangeCoinToUSD(this.body.amount, this.coin);

        const dailyAmountToAmass = fundingTransactionLimit.dailyAmassedAmount + this.body.amount / this.coin.exchangeRate;
        const monthlyAmountToAmass = fundingTransactionLimit.monthlyAmassedAmount + this.body.amount / this.coin.exchangeRate;

        if (usdAmount > tierFunding.max) throw new BadRequestException('Este monto excede el maximo permitido por transacción');
        if (usdAmount <= tierFunding.min) throw new BadRequestException('Este monto no alcanza el minimo permitido por transacción');
        if (dailyAmountToAmass > tierFunding.dailyLimit) throw new BadRequestException('Alcanzaste tu limite diario');
        if (monthlyAmountToAmass > tierFunding.monthlyLimit) throw new BadRequestException('Alcanzaste tu limite mensual');
    }
}
