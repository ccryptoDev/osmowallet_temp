import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionMethodEnum } from 'src/common/enums/transactionMethod.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { App } from 'src/entities/app.entity';
import { Coin } from 'src/entities/coin.entity';
import { FundingTransactionLimit } from 'src/entities/fundingTransactionLimits.entity';
import { TierFunding } from 'src/entities/tierFunding.entity';
import { TierUser } from 'src/entities/tierUser.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { SlackChannel } from 'src/services/slack/enums/slack-channels.enum';
import { SlackEmoji } from 'src/services/slack/enums/slack-emoji.enum';
import { SlackWebhooks } from 'src/services/slack/enums/slack-webhooks.enum';
import { SlackService } from 'src/services/slack/slack.service';
import { createTransactionsTemplate } from 'src/services/slack/templates/transactions.template';
import { EntityManager } from 'typeorm';
import { FundingDto } from '../dtos/funding.dto';
import { FundingMethodEnum } from '../enums/fundingMethod.enum';
import { Funding } from './funding';
import { exchangeCoinToUSD } from 'src/common/utils/exchanger.util';

export class CashInFunding implements Funding {
    constructor(
        private coin: Coin,
        private fundingTransactionLimit: FundingTransactionLimit,
        private manager: EntityManager,
        private user: User,
        private body: FundingDto,
    ) {}

    async fund() {
        const coin = await this.manager.findOneBy(Coin, { id: this.body.coinId });
        if (!coin) throw new BadRequestException('No se encontró la moneda');
        this.coin = coin;

        await this.validateData();
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userWallet, osmoWallet, partner] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, userId: this.user.id }),
                findAndLockWallet({ entityManager: entityManager, coinId: this.coin.id, alias: MainWalletsAccount.MAIN }),
                entityManager.findOneBy(App, { name: this.body.partner }),
            ]);

            if (!userWallet || !osmoWallet || !partner)
                throw new BadRequestException('No se encontraron las billeteras necesarias para realizar la transacción');

            const transactionGroup = entityManager.create(TransactionGroup, {
                status: Status.COMPLETED,
                fromUser: this.user,
                transactionCoin: this.coin,
                type: TransactionType.FUNDING,
                method: TransactionMethodEnum.CASH_IN,
                partner: Partner[partner.name as keyof typeof Partner],
            });

            await entityManager.insert(TransactionGroup, transactionGroup);
            const osmoCreditTransaction = entityManager.create(Transaction, {
                amount: this.body.amount,
                transactionGroup: { id: transactionGroup.id },
                wallet: { id: osmoWallet.id },
                subtype: TransactionSubtype.CREDIT_FIAT_FUNDING_OSMO,
                balance: osmoWallet.availableBalance,
            });

            const userCreditTransaction = entityManager.create(Transaction, {
                transactionGroup: { id: transactionGroup.id },
                amount: this.body.amount,
                wallet: { id: userWallet.id },
                subtype: TransactionSubtype.CREDIT_FIAT_FUNDING,
                balance: userWallet.availableBalance,
            });

            await entityManager.insert(Transaction, [osmoCreditTransaction, userCreditTransaction]);

            this.fundingTransactionLimit.dailyAmassedAmount = new Decimal(this.fundingTransactionLimit.dailyAmassedAmount)
                .plus(new Decimal(this.body.amount).dividedBy(this.coin.exchangeRate).toFixed(2))
                .toNumber();
            this.fundingTransactionLimit.monthlyAmassedAmount = new Decimal(this.fundingTransactionLimit.monthlyAmassedAmount)
                .plus(new Decimal(this.body.amount).dividedBy(this.coin.exchangeRate).toFixed(2))
                .toNumber();

            await entityManager.save(FundingTransactionLimit, this.fundingTransactionLimit);
        });

        SlackService.notifyTransaction({
            baseURL: SlackWebhooks.FUNDING_FIAT,
            data: createTransactionsTemplate({
                channel: SlackChannel.FUNDING_FIAT,
                amount: this.body.amount,
                coin: CoinEnum[this.coin.acronym as keyof typeof CoinEnum],
                firstName: this.user.firstName,
                lastName: this.user.lastName,
                email: this.user.email,
                transactionType: {
                    name: FundingMethodEnum.CASH,
                    emoji: SlackEmoji.MONEY_WITH_WINGS,
                },
                attachmentUrl:
                    'https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98',
            }),
        });
    }

    private async validateData() {
        const [fundingTransactionLimit, tierUser] = await Promise.all([
            this.manager.findOne(FundingTransactionLimit, {
                where: {
                    user: { id: this.user.id },
                    fundingmethod: { id: this.body.fundingMethodId },
                },
            }),
            this.manager.findOne(TierUser, {
                relations: { tier: true },
                where: {
                    user: {
                        id: this.user.id,
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
                tier: { id: tierUser.tier.id },
            },
        });
        if (!tierFunding) throw new BadRequestException('No se encontraron los limites de transacción');

        const usdAmount = exchangeCoinToUSD(this.body.amount, this.coin);

        if (usdAmount > tierFunding.max) throw new BadRequestException('Este monto excede el maximo permitido por transacción');
        if (usdAmount <= tierFunding.min) throw new BadRequestException('Este monto no alcanza el minimo permitido por transacción');
        if (dailyAmountToAmass > tierFunding.dailyLimit) throw new BadRequestException('Alcanzaste tu limite diario');
        if (monthlyAmountToAmass > tierFunding.monthlyLimit) throw new BadRequestException('Alcanzaste tu limite mensual');
        this.fundingTransactionLimit = fundingTransactionLimit;
    }
}
