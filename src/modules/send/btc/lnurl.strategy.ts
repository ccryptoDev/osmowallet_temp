import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import * as ln from 'lnurl';
import { FeatureEnum } from 'src/common/enums/feature.enum';
import { FeeSource } from 'src/common/enums/fee-source.enum';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { IbexServiceException } from 'src/common/exceptions/ibex.exception';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { Coin } from 'src/entities/coin.entity';
import { Feature } from 'src/entities/feature.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { TransactionDetail } from 'src/entities/transaction.detail.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionFee } from 'src/entities/transactionFee.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { UpdateBalanceTransferType } from 'src/modules/balance-updater/enums/type.enum';
import { CoinsService } from 'src/modules/coins/coins.service';
import { FeaturesService } from 'src/modules/features/features.service';
import { PayLnURLResponse } from 'src/modules/ibex/entities/payLnurlResponse';
import { IbexService } from 'src/modules/ibex/ibex.service';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateTransaction } from '../dtos/transaction.dto';
import { Send, SendBtc } from './send.btc';
import { SendBtcData } from './send.data';

export class Lnurl extends Send implements SendBtc {
    constructor(
        ibexService: IbexService,
        googleCloudTasksService: GoogleCloudTasksService,
        manager: EntityManager,
        private coinService: CoinsService,
        private featureService: FeaturesService,
    ) {
        super(ibexService, googleCloudTasksService, manager);
    }

    async sendNative(data: SendBtcData): Promise<any> {
        let btcWallet: Wallet | undefined;
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const userBtcWallet = await findAndLockWallet({
                entityManager: entityManager,
                coinId: data.payload.coinId,
                userId: data.authUser.sub,
            });
            if (!userBtcWallet) throw new BadRequestException('user btc wallet not found');
            btcWallet = userBtcWallet;
            if (btcWallet.availableBalance < data.payload.amount) throw new BadRequestException('Insufficient balance');
            const updatedAvailableBalance = new Decimal(btcWallet.availableBalance).minus(data.payload.amount).toNumber();
            const updatedBalance = new Decimal(btcWallet.balance).minus(data.payload.amount).toNumber();
            await entityManager.update(Wallet, btcWallet.id, { availableBalance: updatedAvailableBalance, balance: updatedBalance });
        });
        const body: CreateTransaction = {
            id: uuidv4(),
            balances: {
                userSatsBalance: btcWallet?.availableBalance,
                osmoWalletFeeBalance: 0,
                userFiatBalance: 0,
            },
            amounts: {
                totalUserBtcToDebit: data.payload.amount,
                osmoFiatFeeToCredit: 0,
                totalUserFiatToDebit: 0,
            },
            btcPrice: data.payload.btcPrice,
            user: data.authUser,
            payload: data.payload,
            wallets: {
                userSatsWallet: btcWallet?.id,
            },
        };
        this.createNativeTransactions(body);
    }

    async sendAutoconvert(data: SendBtcData): Promise<any> {
        const feature = await this.manager.findOneBy(Feature, { name: FeatureEnum.AUTOCONVERT_TO_SEND });
        if (!feature) throw new BadRequestException('Feature not found');
        const tierFeature = await this.featureService.getTierFeature(feature.id, data.authUser);
        const coin = await this.manager.findOneBy(Coin, { id: data.payload.coinId });
        if (!coin) throw new BadRequestException('Coin not found');

        const satCoin = await this.manager.findOneBy(Coin, { acronym: CoinEnum.SATS });
        if (!satCoin) throw new BadRequestException('Coin not found');

        let osmoFiatFeeToCredit = new Decimal(0);
        let totalFiatToDebit = new Decimal(0);
        let userFiatWallet: Wallet | undefined, osmoWalletFee: Wallet | undefined, userBtcWallet: Wallet | undefined;
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            let buyFee = 0;
            //Find my tier
            buyFee = tierFeature.fee;
            let btcPrice = data.payload.btcPrice;
            if (!btcPrice) throw new BadRequestException('BTC price is required');
            btcPrice = btcPrice * coin.exchangeRate;
            const [fiatWallet, walletFee, btcWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: data.payload.coinId, userId: data.authUser.sub }),
                findAndLockWallet({ entityManager: entityManager, coinId: data.payload.coinId, alias: MainWalletsAccount.FEES }),
                findAndLockWallet({ entityManager: entityManager, coinId: satCoin.id, userId: data.authUser.sub }),
            ]);
            if (!fiatWallet || !walletFee || !btcWallet) throw new BadRequestException('Wallets not found');
            userFiatWallet = fiatWallet;
            osmoWalletFee = walletFee;
            userBtcWallet = btcWallet;
            /// EL amount que viene es en SATS
            const inflatedSats = new Decimal(data.payload.amount);

            const fiats = new Decimal(inflatedSats).times(Math.pow(10, -8)).times(btcPrice).toFixed(2);
            osmoFiatFeeToCredit = new Decimal(new Decimal(inflatedSats).times(Math.pow(10, -8)).times(buyFee).times(btcPrice).toFixed(2));
            totalFiatToDebit = new Decimal(new Decimal(fiats).plus(osmoFiatFeeToCredit).toFixed(2));

            if (new Decimal(userFiatWallet.availableBalance).lessThan(new Decimal(fiats)))
                throw new BadRequestException('Insufficient balance');

            await Promise.all([
                entityManager.update(Wallet, osmoWalletFee.id, {
                    availableBalance: new Decimal(osmoWalletFee.availableBalance).plus(osmoFiatFeeToCredit).toNumber(),
                    balance: new Decimal(osmoWalletFee.balance).plus(osmoFiatFeeToCredit).toNumber(),
                }),
                entityManager.update(Wallet, userFiatWallet.id, {
                    availableBalance: new Decimal(userFiatWallet.availableBalance).minus(totalFiatToDebit).toNumber(),
                    balance: new Decimal(userFiatWallet.balance).minus(totalFiatToDebit).toNumber(),
                }),
            ]);
        });
        const body: CreateTransaction = {
            id: uuidv4(),
            user: data.authUser,
            payload: data.payload,
            btcPrice: data.payload.btcPrice,
            amounts: {
                totalUserFiatToDebit: totalFiatToDebit.toNumber(),
                totalUserBtcToDebit: data.payload.amount,
                osmoFiatFeeToCredit: osmoFiatFeeToCredit.toNumber(),
            },
            balances: {
                userFiatBalance: userFiatWallet?.availableBalance,
                osmoWalletFeeBalance: osmoWalletFee?.availableBalance,
                userSatsBalance: userBtcWallet?.availableBalance,
            },
            wallets: {
                osmoFeeWallet: osmoWalletFee?.id,
                userFiatWallet: userFiatWallet?.id,
                userSatsWallet: userBtcWallet?.id,
            },
        };
        this.createAutoconvertTransactions(body);
    }

    async createNativeTransactions(data: CreateTransaction): Promise<void> {
        const lnURLDecode = ln.decode(data.payload.address.toUpperCase());

        const [user, ibexAccount, coin] = await Promise.all([
            this.manager.findOneBy(User, { id: data.user.sub }),
            this.manager.findOne(IbexAccount, { where: { user: { id: data.user.sub } } }),
            this.manager.findOneBy(Coin, { id: data.payload.coinId }),
        ]);
        if (!ibexAccount || !user || !coin) throw new BadRequestException('Ibex account not found');

        const lastHistoricRate = await this.coinService.getLastHistoricRateId();
        const params = await this.ibexService.getParams(lnURLDecode);
        let sendIbexLnURLResponse: PayLnURLResponse;
        try {
            sendIbexLnURLResponse = await this.ibexService.payLnURL(params, data.payload.amount * 1000, ibexAccount.account);
        } catch (error) {
            if (error instanceof IbexServiceException) {
                this.addToRefundQueue({ createSendTransaction: data, transactionGroupId: '', refundToOsmo: false });
                return;
            }
            throw error;
        }
        const finalFeeSats = new Decimal(sendIbexLnURLResponse.feesMsat).dividedBy(1000).toNumber();
        const ibexTransactionId = sendIbexLnURLResponse.transaction.id;
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const btcWallet = await findAndLockWallet({
                entityManager: entityManager,
                coinId: data.payload.coinId,
                userId: data.user.sub,
            });
            if (!btcWallet) throw new BadRequestException('Wallet not found');

            btcWallet.availableBalance = new Decimal(btcWallet.availableBalance).minus(finalFeeSats).toNumber();
            btcWallet.balance = new Decimal(btcWallet.balance).minus(finalFeeSats).toNumber();
            await entityManager.save(btcWallet);
            const transactionGroup = entityManager.create(TransactionGroup, {
                fromUser: user,
                type: TransactionType.SEND,
                transactionCoin: coin,
                btcPrice: data.btcPrice,
                historicRate: { id: lastHistoricRate },
                status: Status.COMPLETED,
                category: { id: data.payload.categoryId },
                note: data.payload.note,
            });
            await entityManager.insert(TransactionGroup, transactionGroup);
            const transaction = entityManager.create(Transaction, {
                amount: data.payload.amount,
                balance: data.balances.userSatsBalance,
                wallet: { id: data.wallets.userSatsWallet },
                subtype: TransactionSubtype.DEBIT_BTC_TRANSFER_LN,
                transactionGroup: transactionGroup,
            });
            await entityManager.insert(Transaction, transaction);

            const transactionDetail = entityManager.create(TransactionDetail, {
                transaction: transaction,
                ibexTransactionId: ibexTransactionId,
                address: data.payload.address,
            });
            const networkFee = entityManager.create(TransactionFee, {
                coin: coin,
                amount: finalFeeSats,
                transactionGroup: transactionGroup,
                source: FeeSource.NETWORK,
            });
            await entityManager.insert(TransactionFee, networkFee);
            await entityManager.insert(TransactionDetail, transactionDetail);
        });
    }

    async createAutoconvertTransactions(data: CreateTransaction): Promise<void> {
        try {
            const lnURLDecode = ln.decode(data.payload.address.toUpperCase());
            const [user, paramsToSend, btcCoin, coin] = await Promise.all([
                this.manager.findOneBy(User, { id: data.user.sub }),
                this.ibexService.getParams(lnURLDecode),
                this.manager.findOneBy(Coin, { acronym: CoinEnum.SATS }),
                this.manager.findOneBy(Coin, { id: data.payload.coinId }),
            ]);
            if (!user || !paramsToSend || !btcCoin || !coin) throw new BadRequestException('User or params not found');
            const lastHistoricRateId = await this.coinService.getLastHistoricRateId();
            let finalFeeSats = new Decimal(0).toNumber();
            const lnurlResponse = await this.ibexService.payLnURL(
                paramsToSend,
                data.payload.amount * 1000,
                process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID ?? '',
            );

            finalFeeSats = new Decimal(lnurlResponse.feesMsat).dividedBy(1000).toNumber();
            await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
                const btcWallet = await findAndLockWallet({
                    entityManager: entityManager,
                    coinId: data.payload.coinId,
                    userId: data.user.sub,
                });
                if (!btcWallet) throw new BadRequestException('Wallet not found');
                btcWallet.availableBalance = new Decimal(btcWallet.availableBalance).minus(finalFeeSats).toNumber();
                btcWallet.balance = new Decimal(btcWallet.balance).minus(finalFeeSats).toNumber();
                await entityManager.save(btcWallet);
                const transactionGroup = entityManager.create(TransactionGroup, {
                    fromUser: user,
                    status: Status.COMPLETED,
                    transactionCoin: coin,
                    type: TransactionType.SEND,
                    btcPrice: data.btcPrice,
                    historicRate: { id: lastHistoricRateId },
                    category: { id: data.payload.categoryId },
                    note: data.payload.note,
                });
                await entityManager.insert(TransactionGroup, transactionGroup);
                const osmoFeeTransaction = entityManager.create(Transaction, {
                    amount: data.amounts.osmoFiatFeeToCredit,
                    balance: data.balances.osmoWalletFeeBalance,
                    transactionGroup: transactionGroup,
                    subtype: TransactionSubtype.FEE_BUY,
                    wallet: { id: data.wallets.osmoFeeWallet },
                });
                const userFiatTransaction = entityManager.create(Transaction, {
                    amount: data.amounts.totalUserFiatToDebit,
                    balance: data.balances.userFiatBalance,
                    transactionGroup: transactionGroup,
                    subtype: TransactionSubtype.DEBIT_FIAT_BUY,
                    wallet: { id: data.wallets.userFiatWallet },
                });
                const userSatsTransaction = entityManager.create(Transaction, {
                    amount: data.amounts.totalUserBtcToDebit,
                    balance: data.balances.userSatsBalance,
                    transactionGroup: transactionGroup,
                    subtype: TransactionSubtype.DEBIT_BTC_TRANSFER_LN,
                    wallet: { id: data.wallets.userSatsWallet },
                });
                const networkFee = entityManager.create(TransactionFee, {
                    amount: finalFeeSats,
                    coin: btcCoin,
                    transactionGroup: transactionGroup,
                    source: FeeSource.NETWORK,
                });
                const osmoFee = entityManager.create(TransactionFee, {
                    amount: data.amounts.osmoFiatFeeToCredit,
                    coin: coin,
                    transactionGroup: transactionGroup,
                });
                await entityManager.insert(Transaction, [osmoFeeTransaction, userFiatTransaction, userSatsTransaction]);
                const transactionDetail = entityManager.create(TransactionDetail, {
                    transaction: userSatsTransaction,
                    ibexTransactionId: lnurlResponse.transaction.id,
                    address: data.payload.address,
                });
                await entityManager.insert(TransactionFee, [networkFee, osmoFee]);
                await entityManager.insert(TransactionDetail, transactionDetail);
            });

            if (!data.amounts.totalUserFiatToDebit) throw new BadRequestException('Amount not found');
            this.addToBalanceUpdaterQueue({
                amount: data.amounts.totalUserFiatToDebit,
                coinId: data.payload.coinId,
                type: UpdateBalanceTransferType.USER_TO_OSMO,
                userId: data.user.sub,
            });
        } catch (error) {
            this.addToRefundQueue({ createSendTransaction: data, transactionGroupId: '', refundToOsmo: false });
        }
    }
}
