import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { FeatureEnum } from 'src/common/enums/feature.enum';
import { FeeSource } from 'src/common/enums/fee-source.enum';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { Coin } from 'src/entities/coin.entity';
import { Feature } from 'src/entities/feature.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
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
import { PayOnChainResponse } from 'src/modules/ibex/entities/payOnChain';
import { IbexService } from 'src/modules/ibex/ibex.service';
import { CoinEnum } from 'src/modules/me/enums/coin.enum';
import { OnChainStatuses } from 'src/modules/webhooks/enums/statuses.enum';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateTransaction } from '../dtos/transaction.dto';
import { PayLnURLErrorInBuyIfEmpty } from '../exceptions/send.exception';
import { Send, SendBtc } from './send.btc';
import { SendBtcData } from './send.data';

export class Onchain extends Send implements SendBtc {
    constructor(
        ibexService: IbexService,
        googleCloudTasksService: GoogleCloudTasksService,
        manager: EntityManager,
        coinService: CoinsService,
        private featureService: FeaturesService,
    ) {
        super(ibexService, googleCloudTasksService, manager);
    }

    async sendNative(data: SendBtcData): Promise<void> {
        await this.featureService.checkFeatureAvailability(data.authUser,FeatureEnum.SEND)
        const feeSat = data.payload.feeSat;
        const totalAmount = data.payload.amount + feeSat;
        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const btcWallet = await findAndLockWallet({
                entityManager: entityManager,
                coinId: data.payload.coinId,
                userId: data.authUser.sub,
            });
            if (btcWallet == null) throw new BadRequestException('Wallet not found');

            if (btcWallet.availableBalance < totalAmount) throw new BadRequestException('Insufficient balance');
            const updatedAvailableBalance = new Decimal(btcWallet.availableBalance).minus(totalAmount).toNumber();
            const updatedBalance = new Decimal(btcWallet.balance).minus(totalAmount).toNumber();
            await entityManager.update(Wallet, btcWallet.id, { availableBalance: updatedAvailableBalance, balance: updatedBalance });
            const body: CreateTransaction = {
                id: uuidv4(),
                user: data.authUser,
                payload: data.payload,
                amounts: {
                    osmoFiatFeeToCredit: 0,
                    totalUserBtcToDebit: totalAmount,
                    totalUserFiatToDebit: 0,
                },
                btcPrice: data.payload.btcPrice,
                balances: {
                    userSatsBalance: btcWallet.availableBalance,
                    osmoWalletFeeBalance: 0,
                    userFiatBalance: 0,
                },
                wallets: {
                    osmoFeeWallet: '',
                    userFiatWallet: '',
                    userSatsWallet: btcWallet.id,
                },
            };
            this.addTransactionToQueue(body);
        });
    }

    async sendAutoconvert(data: SendBtcData): Promise<void> {
        await this.featureService.checkFeatureAvailability(data.authUser,FeatureEnum.AUTOCONVERT_TO_SEND)
        let buyFee = 0;
        const coin = await this.manager.findOneBy(Coin, { id: data.payload.coinId });
        if (coin == null) throw new BadRequestException('Coin not found');

        let lowerLimit = 0;
        let upperLimit = 0;
        let feature: Feature;
        if (data.payload.partner != null && data.payload.partner != Partner.BITREFILL) {
            feature = (await this.manager.findOneBy(Feature, { name: FeatureEnum.SEND_GLOBALLY })) as Feature;
        } else {
            feature = (await this.manager.findOneBy(Feature, { name: FeatureEnum.AUTOCONVERT_TO_SEND })) as Feature;
        }
        const tierFeature = await this.featureService.getTierFeature(feature.id, data.authUser);
        lowerLimit = tierFeature.min;
        upperLimit = tierFeature.max;
        buyFee = tierFeature.fee;
        //let btcPrice = data.payload.btcPrice;
        if (data.payload.btcPrice == null) throw new BadRequestException('Btc price not found');
        const btcPrice = Number(new Decimal(data.payload.btcPrice).times(coin.exchangeRate).toFixed(2));

        const inflatedSats = new Decimal(data.payload.amount).plus(data.payload.feeSat);
        let osmoFiatFeeToCredit = new Decimal(0);
        let totalFiatToDebit = new Decimal(0);
        const fiats = new Decimal(inflatedSats).times(Math.pow(10, -8)).times(btcPrice).toFixed(2);
        osmoFiatFeeToCredit = new Decimal(inflatedSats.times(Math.pow(10, -8)).times(buyFee).times(btcPrice).toFixed(2));
        if (data.payload.partner != null && data.payload.partner != Partner.BITREFILL) {
            const usdOsmoFiatFeeToCredit = osmoFiatFeeToCredit.dividedBy(coin.exchangeRate);
            if (usdOsmoFiatFeeToCredit.greaterThan(new Decimal(50))) {
                const usdFeeAmount = new Decimal(50);
                osmoFiatFeeToCredit = new Decimal(usdFeeAmount).times(coin.exchangeRate);
            }
        }
        osmoFiatFeeToCredit = new Decimal(osmoFiatFeeToCredit.toFixed(2));

        totalFiatToDebit = new Decimal(new Decimal(fiats).plus(osmoFiatFeeToCredit).toFixed(2));
        if (data.payload.partner != null && data.payload.partner) {
            if (totalFiatToDebit.toNumber() < lowerLimit || totalFiatToDebit.toNumber() >= upperLimit)
                throw new BadRequestException('Amount out of limit range');
        }
        const satCoin = await this.manager.findOneBy(Coin, { acronym: CoinEnum.SATS });
        if (satCoin == null) throw new BadRequestException('Coin not found');

        await this.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userFiatWallet, osmoFeeWallet, userBtcWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: data.payload.coinId, userId: data.authUser.sub }),
                findAndLockWallet({ entityManager: entityManager, coinId: data.payload.coinId, alias: MainWalletsAccount.FEES }),
                findAndLockWallet({ entityManager: entityManager, coinId: satCoin.id, userId: data.authUser.sub }),
            ]);
            if (!userFiatWallet || !osmoFeeWallet || !userBtcWallet) throw new BadRequestException('Wallet not found');
            if (new Decimal(userFiatWallet.availableBalance).lessThan(totalFiatToDebit))
                throw new BadRequestException('Insufficient balance');
            await Promise.all([
                entityManager.update(Wallet, userFiatWallet.id, {
                    availableBalance: new Decimal(userFiatWallet.availableBalance).minus(totalFiatToDebit).toNumber(),
                    balance: new Decimal(userFiatWallet.balance).minus(totalFiatToDebit).toNumber(),
                }),
                entityManager.update(Wallet, osmoFeeWallet.id, {
                    availableBalance: new Decimal(osmoFeeWallet.availableBalance).plus(osmoFiatFeeToCredit).toNumber(),
                    balance: new Decimal(osmoFeeWallet.balance).plus(osmoFiatFeeToCredit).toNumber(),
                }),
            ]);
            const body: CreateTransaction = {
                id: uuidv4(),
                user: data.authUser,
                btcPrice: data.payload.btcPrice,
                payload: data.payload,
                amounts: {
                    osmoFiatFeeToCredit: osmoFiatFeeToCredit.toNumber(),
                    totalUserFiatToDebit: totalFiatToDebit.toNumber(),
                    totalUserBtcToDebit: data.payload.amount,
                },
                balances: {
                    userFiatBalance: userFiatWallet.availableBalance,
                    osmoWalletFeeBalance: osmoFeeWallet.availableBalance,
                    userSatsBalance: userBtcWallet.availableBalance,
                },
                wallets: {
                    osmoFeeWallet: osmoFeeWallet.id,
                    userFiatWallet: userFiatWallet.id,
                    userSatsWallet: userBtcWallet.id,
                },
            };
            //this.createAutoconvertTransactions(body)
            this.addTransactionToQueue(body);
        });
    }

    async createNativeTransactions(data: CreateTransaction): Promise<void> {
        const [ibexAccount, user, coin] = await Promise.all([
            this.manager.findOneBy(IbexAccount, {
                user: { id: data.user.sub },
            }),
            this.manager.findOneBy(User, { id: data.user.sub }),
            this.manager.findOneBy(Coin, { id: data.payload.coinId }),
        ]);
        if (ibexAccount == null || user == null || coin == null) throw new BadRequestException('User not found');
        const btcPrice = data.payload.btcPrice;
        const lastHistoricRate = (await this.manager.find(HistoricRate, { order: { id: 'DESC' }, take: 1 }))[0];
        let onchainResponse: PayOnChainResponse;
        try {
            const onchainSent = await this.ibexService.sendOnChain(ibexAccount.account, data.payload, user.id);
            if (!onchainSent) throw new BadRequestException('Error sending onchain');
            onchainResponse = onchainSent;
        } catch (error) {
            this.addToRefundQueue({ createSendTransaction: data, transactionGroupId: '', refundToOsmo: false });
            return;
        }
        const status: Status = OnChainStatuses.CONFIRMED ? Status.COMPLETED : Status.PENDING;
        await this.manager.transaction(async (entityManager) => {
            const transactionGroup = entityManager.create(TransactionGroup, {
                fromUser: { id: data.user.sub },
                historicRate: lastHistoricRate,
                transactionCoin: coin,
                btcPrice: btcPrice,
                type: TransactionType.SEND,
                status: status,
                category: { id: data.payload.categoryId },
                note: data.payload.note,
            });
            await entityManager.insert(TransactionGroup, transactionGroup);
            const transaction = entityManager.create(Transaction, {
                amount: data.amounts.totalUserBtcToDebit,
                transactionGroup: transactionGroup,
                balance: data.balances.userSatsBalance,
                subtype: TransactionSubtype.DEBIT_BTC_TRANSFER_ONCHAIN,
                wallet: { id: data.wallets.userSatsWallet },
            });
            await entityManager.insert(Transaction, transaction);
            const transactionDetail = entityManager.create(TransactionDetail, {
                transaction: transaction,
                ibexTransactionId: onchainResponse.transactionId,
                address: data.payload.address,
            });
            await entityManager.insert(TransactionDetail, transactionDetail);
            const networkFee = entityManager.create(TransactionFee, {
                amount: data.payload.feeSat,
                coin: coin,
                transactionGroup: transactionGroup,
                source: FeeSource.NETWORK,
            });
            await entityManager.insert(TransactionFee, networkFee);
        });
    }

    async createAutoconvertTransactions(data: CreateTransaction): Promise<void> {
        try {
            await this.doFastBuy(data);
            const [ibexAccount, user, btcCoin, coin] = await Promise.all([
                this.manager.findOne(IbexAccount, {
                    where: {
                        user: {
                            id: data.user.sub,
                        },
                    },
                }),
                this.manager.findOneBy(User, { id: data.user.sub }),
                this.manager.findOneBy(Coin, { acronym: CoinEnum.SATS }),
                this.manager.findOneBy(Coin, { id: data.payload.coinId }),
            ]);

            if (ibexAccount == null || user == null || btcCoin == null || coin == null) throw new BadRequestException('User not found');

            const btcPrice = data.payload.btcPrice;
            const lastHistoricRate = (await this.manager.find(HistoricRate, { order: { id: 'DESC' }, take: 1 }))[0];
            let status: Status = Status.PENDING;
            const onchainResponse = await this.ibexService.sendOnChain(ibexAccount.account, data.payload, user.id);

            if (onchainResponse?.status == OnChainStatuses.CONFIRMED) {
                status = Status.COMPLETED;
            }
            await this.manager.transaction(async (entityManager) => {
                const transactionGroup = entityManager.create(TransactionGroup, {
                    fromUser: user,
                    historicRate: lastHistoricRate,
                    transactionCoin: coin,
                    btcPrice: btcPrice,
                    type: TransactionType.SEND,
                    partner: data.payload.partner,
                    status: status,
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
                const userBtcTransaction = entityManager.create(Transaction, {
                    amount: data.amounts.totalUserBtcToDebit,
                    balance: data.balances.userSatsBalance,
                    transactionGroup: transactionGroup,
                    subtype: TransactionSubtype.DEBIT_BTC_TRANSFER_ONCHAIN,
                    wallet: { id: data.wallets.userSatsWallet },
                });
                await entityManager.insert(Transaction, [osmoFeeTransaction, userFiatTransaction, userBtcTransaction]);
                const transactionDetail = entityManager.create(TransactionDetail, {
                    transaction: userBtcTransaction,
                    ibexTransactionId: onchainResponse?.transactionId,
                    address: data.payload.address,
                });
                const osmoFee = entityManager.create(TransactionFee, {
                    amount: data.amounts.osmoFiatFeeToCredit,
                    coin: coin,
                    transactionGroup: transactionGroup,
                });
                const networkFee = entityManager.create(TransactionFee, {
                    amount: data.payload.feeSat,
                    coin: btcCoin,
                    transactionGroup: transactionGroup,
                    source: FeeSource.NETWORK,
                });
                await entityManager.insert(TransactionFee, [osmoFee, networkFee]);
                await entityManager.insert(TransactionDetail, transactionDetail);
            });
            if (status == Status.COMPLETED) {
                if (data.amounts.totalUserFiatToDebit == undefined) throw new BadRequestException('Amount not found');
                this.addToBalanceUpdaterQueue({
                    amount: data.amounts.totalUserFiatToDebit,
                    coinId: data.payload.coinId,
                    type: UpdateBalanceTransferType.USER_TO_OSMO,
                    userId: data.user.sub,
                });
            }
        } catch (error) {
            let refundToOsmo = true;
            if (error instanceof PayLnURLErrorInBuyIfEmpty) {
                refundToOsmo = false;
            }
            this.addToRefundQueue({ createSendTransaction: data, transactionGroupId: '', refundToOsmo: refundToOsmo });
        }
    }
}
