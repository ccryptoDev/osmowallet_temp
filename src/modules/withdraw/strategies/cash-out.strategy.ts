import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ValidatorData } from 'src/common/dto_validators/validator-data';
import { FeatureEnum } from 'src/common/enums/feature.enum';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionMethodEnum } from 'src/common/enums/transactionMethod.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { App } from 'src/entities/app.entity';
import { Coin } from 'src/entities/coin.entity';
import { Feature } from 'src/entities/feature.entity';
import { Otp } from 'src/entities/otp.entity';
import { TierFeature } from 'src/entities/tierFeature.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionFee } from 'src/entities/transactionFee.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { UserTransactionLimit } from 'src/entities/userTransactionLimit.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { WithdrawalMethod } from 'src/entities/withdrawalMethod.entity';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { CashOutDto, Data } from 'src/modules/partners/cash-in-out/dtos/cash-out.dto';
import { SlackChannel } from 'src/services/slack/enums/slack-channels.enum';
import { SlackEmoji } from 'src/services/slack/enums/slack-emoji.enum';
import { SlackWebhooks } from 'src/services/slack/enums/slack-webhooks.enum';
import { SlackService } from 'src/services/slack/slack.service';
import { createTransactionsTemplate } from 'src/services/slack/templates/transactions.template';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import { WithdrawDto } from '../dtos/withdraw.dto';
import { WithdrawalMethodEnum } from '../enums/withdrawalMethod.enum';
import { Withdraw } from './withdraw';

export class CashOutWithdraw implements Withdraw {
    constructor(
        private manager: EntityManager,
        private user: User,
        private body: WithdrawDto,
        private tierFeature: TierFeature,
    ) {}

    async withdraw() {
        const withdrawData = await ValidatorData.validate<CashOutDto['data']>(this.body.data, Data);

        const otp = await this.checkOTPValidity(withdrawData.token);

        const [user, feature, withdrawalMethod, coin, partner] = await Promise.all([
            this.manager.findOneBy(User, { id: this.user.id }),
            this.manager.findOneBy(Feature, { name: FeatureEnum.WITHDRAW }),
            this.manager.findOneBy(WithdrawalMethod, { name: WithdrawalMethodEnum.AKISI }),
            this.manager.findOneBy(Coin, { id: this.body.coinId }),
            this.manager.findOneBy(App, { name: this.body.partner }),
        ]);
        if (!user || !feature || !withdrawalMethod || !coin || !partner) throw new BadRequestException('Invalid data');

        const userTransactionLimit = await this.manager.findOne(UserTransactionLimit, {
            where: {
                user: { id: user.id },
                feature: { id: feature.id },
            },
        });

        if (!userTransactionLimit) throw new BadRequestException('User transaction limit not found');

        await this.checkDailyMonthlyLimits(userTransactionLimit, this.body, coin);

        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const fee = parseFloat(new Decimal(this.body.amount).mul(withdrawalMethod.fee).toFixed(2));
            const [wallet, osmoWallet, osmoWalletFee] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: coin.id, userId: this.user.id }),
                findAndLockWallet({ entityManager: entityManager, coinId: coin.id, alias: MainWalletsAccount.MAIN }),
                findAndLockWallet({ entityManager: entityManager, coinId: coin.id, alias: MainWalletsAccount.FEES }),
            ]);

            if (!wallet || !osmoWallet || !osmoWalletFee) throw new BadRequestException('Wallet not found');

            const amountToDebitFromOsmo = new Decimal(this.body.amount).minus(fee).toNumber();
            const amountToDebitFromUser = new Decimal(this.body.amount).plus(fee).toNumber();

            if (wallet.availableBalance < amountToDebitFromUser) throw new BadRequestException('Insufficient balance');

            const userWalletNewAvailableBalance = new Decimal(wallet.availableBalance).minus(amountToDebitFromUser).toNumber();
            const osmoWalletNewAvailableBalance = new Decimal(osmoWallet.availableBalance).minus(amountToDebitFromOsmo).toNumber();
            const osmoWalletFeeNewAvailableBalance = new Decimal(osmoWalletFee.availableBalance).minus(fee).toNumber();

            await Promise.all([
                entityManager.update(Wallet, wallet.id, {
                    availableBalance: userWalletNewAvailableBalance,
                    balance: new Decimal(wallet.balance).minus(amountToDebitFromUser).toNumber(),
                }),
                entityManager.update(Wallet, osmoWallet.id, {
                    availableBalance: osmoWalletNewAvailableBalance,
                    balance: new Decimal(osmoWallet.balance).minus(amountToDebitFromOsmo).toNumber(),
                }),
                entityManager.update(Wallet, osmoWalletFee.id, {
                    availableBalance: osmoWalletFeeNewAvailableBalance,
                    balance: new Decimal(osmoWalletFee.balance).minus(fee).toNumber(),
                }),
            ]);

            const transactionGroup = entityManager.create(TransactionGroup, {
                status: Status.COMPLETED,
                fromUser: user,
                transactionCoin: coin,
                type: TransactionType.WITHDRAW,
                method: TransactionMethodEnum.CASH_OUT,
                partner: Partner[partner.name as keyof typeof Partner],
            });
            await entityManager.save(TransactionGroup, transactionGroup, { reload: true });

            const osmoDebitTransaction = entityManager.create(Transaction, {
                amount: amountToDebitFromOsmo,
                transactionGroup: transactionGroup,
                wallet: osmoWallet,
                subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW_OSMO,
                balance: osmoWalletNewAvailableBalance,
            });

            const osmoFeeTransaction = entityManager.create(Transaction, {
                amount: fee,
                transactionGroup: transactionGroup,
                wallet: osmoWalletFee,
                subtype: TransactionSubtype.FEE_WITHDRAW,
                balance: osmoWalletFeeNewAvailableBalance,
            });

            const transactionRecord = entityManager.create(Transaction, {
                transactionGroup: transactionGroup,
                amount: amountToDebitFromUser,
                wallet: wallet,
                subtype: TransactionSubtype.DEBIT_FIAT_WITHDRAW,
                balance: userWalletNewAvailableBalance,
            });
            await entityManager.insert(Transaction, [transactionRecord, osmoFeeTransaction, osmoDebitTransaction]);
            userTransactionLimit.dailyAmassedAmount = new Decimal(userTransactionLimit.dailyAmassedAmount)
                .plus(this.body.amount / coin.exchangeRate)
                .toNumber();
            userTransactionLimit.monthlyAmassedAmount = new Decimal(userTransactionLimit.monthlyAmassedAmount)
                .plus(this.body.amount / coin.exchangeRate)
                .toNumber();
            await entityManager.save(userTransactionLimit);
            const osmoFee = entityManager.create(TransactionFee, {
                amount: fee,
                coin: coin,
                transactionGroup: transactionGroup,
            });
            await entityManager.insert(TransactionFee, osmoFee);

            await entityManager.delete(Otp, otp.id);
        });

        SlackService.notifyTransaction({
            baseURL: SlackWebhooks.OSMO_WITHDRAW,
            data: createTransactionsTemplate({
                channel: SlackChannel.OSMO_WITHDRAW,
                amount: this.body.amount,
                coin: CoinEnum[coin.acronym as keyof typeof CoinEnum],
                firstName: this.user.firstName,
                lastName: this.user.lastName,
                email: this.user.email,
                transactionType: {
                    name: WithdrawalMethodEnum.CASH_OUT,
                    emoji: SlackEmoji.MONEY_WITH_WINGS,
                },
                attachmentUrl:
                    'https://firebasestorage.googleapis.com/v0/b/osmowallet.appspot.com/o/logo_cuadrado.png?alt=media&token=955446df-d591-484c-986f-1211a14dad98',
            }),
        });
    }

    private async checkOTPValidity(token: number) {
        const otp = await this.manager.findOne(Otp, {
            where: {
                otp: token,
                expiry: MoreThanOrEqual(new Date()),
            },
        });
        if (!otp) throw new BadRequestException('OTP not found or expired');

        return otp;
    }

    private async checkDailyMonthlyLimits(records: UserTransactionLimit, data: WithdrawDto, coin: Coin) {
        const dailyAmountToAmass = records.dailyAmassedAmount + data.amount / coin.exchangeRate;
        const monthlyAmountToAmass = records.monthlyAmassedAmount + data.amount / coin.exchangeRate;
        if (dailyAmountToAmass > this.tierFeature.dailyLimit) throw new BadRequestException('Daily limit reached');
        if (monthlyAmountToAmass > this.tierFeature.monthlyLimit) throw new BadRequestException('Monthly limit reached');
    }
}
