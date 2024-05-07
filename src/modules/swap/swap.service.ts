import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ln from 'lnurl';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { Coin } from 'src/entities/coin.entity';
import { Feature } from 'src/entities/feature.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { RecurrentBuy } from 'src/entities/recurrent.buy.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionFee } from 'src/entities/transactionFee.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/payloads/auth.payload';
import { IbexService } from '../ibex/ibex.service';
import { CoinEnum } from '../me/enums/coin.enum';
import { RecurrentBuyPayload } from './dtos/recurrentBuyPayload.dto';
import { RecurrentBuyTransactionData } from './dtos/recurrentBuyTransactionData.dto';
import { SwapDto } from './dtos/swap.dto';
import { SwapTransactionDto } from './dtos/swapTransaction.dto';
//import { Period } from 'src/entities/period.entity';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { differenceInMinutes } from 'date-fns';
import Decimal from 'decimal.js';
import { Model } from 'mongoose';
import { FeatureEnum } from 'src/common/enums/feature.enum';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { Wallet } from 'src/entities/wallet.entity';
import { Addresses } from 'src/schemas/addresses.schema';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { BalanceUpdaterService } from '../balance-updater/balance-updater.service';
import { UpdateBalanceTransferType } from '../balance-updater/enums/type.enum';
import { UpdateBalance } from '../balance-updater/interfaces/updateBalance';
import { FeaturesService } from '../features/features.service';
import { Types } from '../ibex/enum/type.enum';
import { MobileRoutePaths } from '../push-notification/enums/mobileRoutesPaths.enum';
import { PushNotificationService } from '../push-notification/push-notification.service';
import { TransactionsService } from '../transactions/transactions.service';
import { RecurrentBuyDto } from './dtos/recurrentBuy.dto';
import { WalletSwap } from './enums/swapWallet.enum';
import { AutoconvertToReceivePayload } from './interfaces/autoconvert.interface';
import { AutoconvertTransaction } from './interfaces/autoconvertTransaction.interface';

@Injectable()
export class SwapService {
    private queue = `SWAP-${process.env.ENV}`;
    private url = `https://${process.env.DOMAIN}/swap/create`;
    private recurrentBuyQueue = `SWAP-${process.env.ENV}`;
    private recurrentTransactionBuyUrl = `https://${process.env.DOMAIN}/swap/recurrent-buys/transactions-create`;
    private recurrentBuyUrl = `https://${process.env.DOMAIN}/swap/recurrent-buys/buy`;
    private autoconvertQueue = `AUTOCONVERT-${process.env.ENV}`;
    private autoconvertUrl = `https://${process.env.DOMAIN}/swap/autoconvert`;
    private autoconvertCreateUrl = `https://${process.env.DOMAIN}/swap/autoconvert-create`;

    constructor(
        private configService: ConfigService,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Coin) private coinRepository: Repository<Coin>,
        @InjectRepository(RecurrentBuy) private recurrentBuyRepository: Repository<RecurrentBuy>,
        //@InjectRepository(Period) private periodRepository: Repository<Period>,
        @InjectRepository(Feature) private featureRepository: Repository<Feature>,
        @InjectModel(Addresses.name) private addressModel: Model<Addresses>,
        @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
        private ibexService: IbexService,
        private googleTasksService: GoogleCloudTasksService,
        private pushNotificationService: PushNotificationService,
        private featureService: FeaturesService,
        private transactionService: TransactionsService,
    ) {}

    addToBalanceUpdaterQueue(data: UpdateBalance) {
        this.googleTasksService.createInternalTask(BalanceUpdaterService.queue, data, BalanceUpdaterService.url);
    }

    addAutoconvertToQueue(data: AutoconvertToReceivePayload) {
        this.googleTasksService.createInternalTask(this.autoconvertQueue, data, this.autoconvertUrl);
    }

    async createAutoconvertToReceiveTransaction(data: AutoconvertTransaction) {
        const toCoin = await this.coinRepository.findOneBy({ id: data.payload.toCoinId });
        if (!toCoin) throw new BadRequestException('Invalid coin');

        await this.userRepository.manager.transaction(async (entityManager) => {
            const transactionGroup = entityManager.create(TransactionGroup, {
                fromUser: { id: data.payload.authUser.sub },
                type: TransactionType.AUTOCONVERT,
                transactionCoin: { id: data.payload.toCoinId },
                btcPrice: data.payload.btcPrice,
                status: Status.COMPLETED,
            });

            await entityManager.insert(TransactionGroup, transactionGroup);

            const creditOsmoFeeTransaction = entityManager.create(Transaction, {
                amount: data.amounts.osmoFeeToCredit,
                wallet: { id: data.wallets.osmoFeeWallet },
                balance: data.balances.osmoWalletFeeBalance,
                subtype: TransactionSubtype.FEE_AUTOCONVERT_SELL,
                transactionGroup: transactionGroup,
            });

            const userBtcCreditTransaction = entityManager.create(Transaction, {
                amount: data.amounts.userBtcToCredit,
                balance: data.balances.userSatsBalance,
                wallet: { id: data.wallets.userSatsWallet },
                subtype: TransactionSubtype.CREDIT_BTC_TRANSFER_LN,
                transactionGroup: transactionGroup,
            });

            const userFiatCreditTransaction = entityManager.create(Transaction, {
                amount: data.amounts.userFiatToCredit,
                wallet: { id: data.wallets.userFiatWallet },
                balance: data.balances.userFiatBalance,
                subtype: TransactionSubtype.CREDIT_FIAT_SELL,
                transactionGroup: transactionGroup,
            });
            const fee = entityManager.create(TransactionFee, {
                coin: { id: data.payload.toCoinId },
                amount: data.amounts.osmoFeeToCredit,
                transactionGroup: transactionGroup,
            });
            await entityManager.save([creditOsmoFeeTransaction, userBtcCreditTransaction, userFiatCreditTransaction]);
            await entityManager.insert(TransactionFee, fee);
        });
        this.addToBalanceUpdaterQueue({
            amount: data.amounts.userFiatToCredit,
            coinId: data.payload.toCoinId,
            userId: data.payload.authUser.sub,
            type: UpdateBalanceTransferType.OSMO_TO_USER,
        });
        const user = await this.userRepository.findOneBy({ id: data.payload.authUser.sub });
        if (!user) throw new BadRequestException('User not found');

        this.pushNotificationService.sendPushToUser(user, {
            title: 'Autoconvert',
            message: `Se te acreditaron ${data.amounts.userFiatToCredit} a tu cuenta de ${toCoin.acronym}`,
            data: {
                currency: toCoin.acronym,
                amount: data.amounts.userFiatToCredit.toString(),
            },
        });

        const ibexOsmoLnurlAddressPayer = this.configService.getOrThrow('IBEX_OSMO_LNURL_ADDRESS_PAYER');

        const lnURLDecode = ln.decode(ibexOsmoLnurlAddressPayer);
        const params = await this.ibexService.getParams(lnURLDecode);
        const [ibexAccount] = await Promise.all([
            this.ibexAccountRepository.findOne({
                where: {
                    user: { id: data.payload.authUser.sub },
                },
            }),
        ]);
        if (!ibexAccount) throw new BadRequestException('Ibex account not found');
        await this.ibexService.payLnURL(params, data.payload.satsToSell * 1000, ibexAccount.account);
    }

    async autoConvertToReceive(data: AutoconvertToReceivePayload) {
        const feature = await this.featureRepository.findOneBy({ name: FeatureEnum.AUTOCONVERT });
        if (!feature) throw new BadRequestException('Feature not found');

        const tierFeature = await this.featureService.getTierFeature(feature.id, data.authUser);
        const fee = tierFeature.fee;
        let btcPrice = data.btcPrice;
        const toCoin = await this.coinRepository.findOneBy({ id: data.toCoinId });
        if (!toCoin) throw new BadRequestException('Invalid coin');

        const satsRemaining = new Decimal(data.totalSats).minus(data.satsToSell);
        await this.userRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userBtcWallet, userFiatWallet, osmoWalletFee] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: data.fromCoinId, userId: data.authUser.sub }),
                findAndLockWallet({ entityManager: entityManager, coinId: data.toCoinId, userId: data.authUser.sub }),
                findAndLockWallet({ entityManager: entityManager, coinId: data.toCoinId, alias: MainWalletsAccount.FEES }),
            ]);
            if (!userBtcWallet || !userFiatWallet || !osmoWalletFee) throw new BadRequestException('Wallet not found');
            btcPrice = new Decimal(btcPrice).mul(toCoin.exchangeRate).toDecimalPlaces(2).toNumber();
            // In this case data.amount represents amount in Sats
            // Make calcules
            const subTotalfiatAmount = new Decimal(btcPrice).mul(data.satsToSell).div(Math.pow(10, 8)).toFixed(2);
            const osmoFee = new Decimal(subTotalfiatAmount).mul(fee).toDecimalPlaces(2);
            const totalFiatAmount = new Decimal(subTotalfiatAmount).minus(osmoFee).toDecimalPlaces(2);

            await Promise.all([
                entityManager.update(Wallet, userBtcWallet.id, {
                    availableBalance: new Decimal(userBtcWallet.availableBalance).plus(satsRemaining).toNumber(),
                    balance: new Decimal(userBtcWallet.balance).plus(satsRemaining).toNumber(),
                }),
                entityManager.update(Wallet, userFiatWallet.id, {
                    availableBalance: new Decimal(userFiatWallet.availableBalance).plus(totalFiatAmount).toNumber(),
                    balance: new Decimal(userFiatWallet.balance).plus(totalFiatAmount).toNumber(),
                }),
                entityManager.update(Wallet, osmoWalletFee.id, {
                    availableBalance: new Decimal(osmoWalletFee.availableBalance).plus(osmoFee).toNumber(),
                    balance: new Decimal(osmoWalletFee.balance).plus(osmoFee).toNumber(),
                }),
            ]);
            const body: AutoconvertTransaction = {
                transactionType: TransactionType.RECEPTION,
                amounts: {
                    osmoFeeToCredit: osmoFee.toNumber(),
                    userFiatToCredit: totalFiatAmount.toNumber(),
                    userBtcToCredit: data.totalSats,
                },
                balances: {
                    osmoWalletFeeBalance: osmoWalletFee.availableBalance,
                    userFiatBalance: userFiatWallet.availableBalance,
                    userSatsBalance: userBtcWallet.availableBalance,
                },
                wallets: {
                    osmoFeeWallet: osmoWalletFee.id,
                    userFiatWallet: userFiatWallet.id,
                    userSatsWallet: userBtcWallet.id,
                },
                fiatToFiat: false,
                payload: data,
            };
            this.googleTasksService.createInternalTask(this.autoconvertQueue, body, this.autoconvertCreateUrl);
        });
    }

    async swap(authUser: AuthUser, data: SwapDto) {
        await this.featureService.checkFeatureAvailability(authUser,FeatureEnum.SWAP)
        await this.transactionService.checkTransactionRateLimit(authUser.sub, TransactionType.SWAP);
        const fromCoin = await this.coinRepository.findOneBy({
            id: data.fromCoinId,
        });
        const toCoin = await this.coinRepository.findOneBy({ id: data.toCoinId });
        if (!fromCoin || !toCoin) throw new BadGatewayException('Moneda no valida');
        if (fromCoin.id == toCoin.id) throw new BadGatewayException('No se puede swappear a la misma moneda');

        if (fromCoin.acronym == CoinEnum.SATS && toCoin.acronym != CoinEnum.SATS) {
            return this.sell(authUser, data, toCoin);
        }

        if (fromCoin.acronym != CoinEnum.SATS && toCoin.acronym == CoinEnum.SATS) {
            if (data.wallet == WalletSwap.OSMO) {
                return this.buy(authUser, data, fromCoin);
            }
        }

        if (fromCoin.acronym != CoinEnum.SATS && toCoin.acronym != CoinEnum.SATS) {
            return this.buy(authUser, data, fromCoin, true);
        }
    }

    async createTransactions(data: SwapTransactionDto) {
        const fromCoin = await this.coinRepository.findOneBy({
            id: data.payload.fromCoinId,
        });
        const toCoin = await this.coinRepository.findOneBy({
            id: data.payload.toCoinId,
        });
        if (!fromCoin || !toCoin) throw new BadRequestException('Invalid coin');

        if (fromCoin.acronym != CoinEnum.SATS && toCoin.acronym == CoinEnum.SATS) {
            return this.createBuyTransaction(data, fromCoin);
        }
        if (fromCoin.acronym == CoinEnum.SATS && toCoin.acronym != CoinEnum.SATS) {
            return this.createSellTransaction(data, toCoin);
        }
        if (data.fiatToFiat) {
            return this.createBuyTransaction(data, fromCoin);
        }
    }

    async createSellTransaction(data: SwapTransactionDto, toCoin: Coin) {
        const [ibexAccount] = await Promise.all([
            this.ibexAccountRepository.findOne({
                where: {
                    user: { id: data.user.sub },
                },
            }),
        ]);
        if (!ibexAccount) throw new BadRequestException('Ibex account not found');

        const ibexOsmoLnurlAddressPayer = this.configService.getOrThrow('IBEX_OSMO_LNURL_ADDRESS_PAYER');

        const lnURLDecode = ln.decode(ibexOsmoLnurlAddressPayer);
        const params = await this.ibexService.getParams(lnURLDecode);
        await this.ibexService.payLnURL(params, data.amounts.userSatsAmount * 1000, ibexAccount.account);
        await this.userRepository.manager.transaction(async (entityManager) => {
            const transactionGroup = entityManager.create(TransactionGroup, {
                fromUser: { id: data.user.sub },
                type: TransactionType.SWAP,
                transactionCoin: toCoin,
                btcPrice: data.payload.btcPrice,
                status: Status.COMPLETED,
            });

            await entityManager.insert(TransactionGroup, transactionGroup);

            const creditOsmoFeeTransaction = entityManager.create(Transaction, {
                amount: data.amounts.osmoFeeAmount,
                wallet: { id: data.wallets.osmoFeeWallet },
                balance: data.balances.osmoFeeBalance,
                subtype: TransactionSubtype.FEE_SELL,
                transactionGroup: transactionGroup,
            });

            const userDebitTransaction = entityManager.create(Transaction, {
                amount: data.amounts.userSatsAmount,
                balance: data.balances.userSatsBalance,
                wallet: { id: data.wallets.userSatsWallet },
                subtype: TransactionSubtype.DEBIT_BTC_SELL,
                transactionGroup: transactionGroup,
            });

            const userCreditTransaction = entityManager.create(Transaction, {
                amount: data.amounts.userFiatAmount,
                wallet: { id: data.wallets.userFiatWallet },
                balance: data.balances.userFiatBalance,
                subtype: TransactionSubtype.CREDIT_FIAT_SELL,
                transactionGroup: transactionGroup,
            });
            const fee = entityManager.create(TransactionFee, {
                coin: toCoin,
                amount: data.amounts.osmoFeeAmount,
                transactionGroup: transactionGroup,
            });
            await entityManager.save([creditOsmoFeeTransaction, userCreditTransaction, userDebitTransaction]);
            await entityManager.insert(TransactionFee, fee);
            this.addToBalanceUpdaterQueue({
                amount: data.amounts.userFiatAmount,
                coinId: data.payload.toCoinId,
                userId: data.user.sub,
                type: UpdateBalanceTransferType.OSMO_TO_USER,
            });
            const user = await this.userRepository.findOneBy({ id: data.user.sub });
            if (!user) throw new BadRequestException('User not found');

            this.pushNotificationService.sendPushToUser(user, {
                title: 'Autoconvert',
                message: `Se te acreditaron ${data.amounts.userFiatAmount} a tu cuenta de ${toCoin.acronym}`,
            });
        });
    }

    async createBuyTransaction(data: SwapTransactionDto, fromCoin: Coin) {
        const [user, userAddresses] = await Promise.all([
            this.userRepository.findOneBy({ id: data.user.sub }),
            this.addressModel.findOne({ user: data.user.sub }).exec(),
        ]);
        if (!user || !userAddresses) throw new BadRequestException('User or User Addresses not found');

        const lnPayer = userAddresses.addresses.find((address) => address.type == Types.LNURL_PAYER);

        if (!lnPayer) throw new BadRequestException('LN Payer not found');

        const lnURLDecode = ln.decode(lnPayer.address);
        const params = await this.ibexService.getParams(lnURLDecode);
        const ibexNativeOsmoAccountId = this.configService.getOrThrow('IBEX_NATIVE_OSMO_ACCOUNT_ID');
        await this.ibexService.payLnURL(params, data.amounts.userSatsAmount * 1000, ibexNativeOsmoAccountId);

        await this.userRepository.manager.transaction(async (entityManager) => {
            const transactionGroup = entityManager.create(TransactionGroup, {
                fromUser: user,
                transactionCoin: fromCoin,
                btcPrice: data.payload.btcPrice,
                type: TransactionType.SWAP,
                status: Status.COMPLETED,
            });
            await entityManager.insert(TransactionGroup, transactionGroup);

            const creditOsmoFeeTransaction = entityManager.create(Transaction, {
                amount: data.amounts.osmoFeeAmount,
                wallet: { id: data.wallets.osmoFeeWallet },
                balance: data.balances.osmoFeeBalance,
                transactionGroup: transactionGroup,
                subtype: TransactionSubtype.FEE_BUY,
            });

            const userDebitTransaction = entityManager.create(Transaction, {
                amount: data.amounts.userFiatAmount,
                transactionGroup: transactionGroup,
                wallet: { id: data.wallets.userFiatWallet },
                balance: data.balances.userFiatBalance,
                subtype: TransactionSubtype.DEBIT_FIAT_BUY,
            });

            const userCreditTransaction = entityManager.create(Transaction, {
                amount: data.amounts.userSatsAmount,
                transactionGroup: transactionGroup,
                balance: data.balances.userSatsBalance,
                wallet: { id: data.wallets.userSatsWallet },
                subtype: TransactionSubtype.CREDIT_BTC_BUY,
            });
            const fee = entityManager.create(TransactionFee, {
                coin: fromCoin,
                amount: data.amounts.osmoFeeAmount,
                transactionGroup: transactionGroup,
            });

            await entityManager.insert(Transaction, [creditOsmoFeeTransaction, userDebitTransaction, userCreditTransaction]);

            await entityManager.insert(TransactionFee, fee);
            this.addToBalanceUpdaterQueue({
                amount: data.amounts.userFiatAmount,
                coinId: data.payload.fromCoinId,
                userId: data.user.sub,
                type: UpdateBalanceTransferType.USER_TO_OSMO,
            });
        });
        if (data.fiatToFiat) {
            const coin = await this.coinRepository.findOneBy({ acronym: CoinEnum.SATS });
            if (!coin) throw new BadRequestException('Invalid coin');
            fromCoin = coin;
            const toCoin = await this.coinRepository.findOneBy({ id: data.payload.toCoinId });
            if (!toCoin) throw new BadRequestException('Invalid coin');

            this.sell(
                data.user,
                {
                    amount: data.amounts.userSatsAmount,
                    btcPrice: data.payload.btcPrice,
                    fromCoinId: fromCoin.id,
                    toCoinId: data.payload.toCoinId,
                    wallet: WalletSwap.OSMO,
                },
                toCoin,
                data.fiatToFiat,
            );
        }
    }

    async sell(
        authUser: AuthUser,
        data: SwapDto,
        toCoin: Coin,
        fiatToFiat: boolean = false,
        transactionType: TransactionType = TransactionType.SWAP,
    ) {
        console.log('SWAP: ', data);
        if (!Number.isInteger(data.amount)) throw new BadRequestException('Amount must be an integer');

        const feature = await this.featureRepository.findOneBy({
            name: transactionType,
        });
        if (!feature) throw new BadRequestException('Feature not found');
        const tierFeature = await this.featureService.getTierFeature(feature.id, authUser);
        let fee = tierFeature.fee;
        fee = fiatToFiat ? new Decimal(fee).dividedBy(2).toNumber() : new Decimal(fee).toNumber(); // when is fiat to fiat the fee should be the half
        let btcPrice = data.btcPrice;
        await this.userRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userBtcWallet, userFiatWallet, osmoWalletFee] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: data.fromCoinId, userId: authUser.sub }),
                findAndLockWallet({ entityManager: entityManager, coinId: data.toCoinId, userId: authUser.sub }),
                findAndLockWallet({ entityManager: entityManager, coinId: data.toCoinId, alias: MainWalletsAccount.FEES }),
            ]);
            if (!userBtcWallet || !userFiatWallet || !osmoWalletFee) throw new BadRequestException('Wallets not found');

            if (userBtcWallet.availableBalance < data.amount) throw new BadRequestException('Insufficiente balance');

            btcPrice = new Decimal(btcPrice).mul(toCoin.exchangeRate).toDecimalPlaces(2).toNumber();
            // In this case data.amount represents amount in Sats
            // Make calcules
            const subTotalfiatAmount = new Decimal(btcPrice).mul(data.amount).div(Math.pow(10, 8)).toFixed(2);
            const osmoFee = new Decimal(subTotalfiatAmount).mul(fee).toDecimalPlaces(2);
            const totalFiatAmount = new Decimal(subTotalfiatAmount).minus(osmoFee).toDecimalPlaces(2);

            await Promise.all([
                entityManager.update(Wallet, userBtcWallet.id, {
                    availableBalance: new Decimal(userBtcWallet.availableBalance).minus(data.amount).toNumber(),
                    balance: new Decimal(userBtcWallet.balance).minus(data.amount).toNumber(),
                }),
                entityManager.update(Wallet, userFiatWallet.id, {
                    availableBalance: new Decimal(userFiatWallet.availableBalance).plus(totalFiatAmount).toNumber(),
                    balance: new Decimal(userFiatWallet.balance).plus(totalFiatAmount).toNumber(),
                }),
                entityManager.update(Wallet, osmoWalletFee.id, {
                    availableBalance: new Decimal(osmoWalletFee.availableBalance).plus(osmoFee).toNumber(),
                    balance: new Decimal(osmoWalletFee.balance).plus(osmoFee).toNumber(),
                }),
            ]);
            const body: SwapTransactionDto = {
                wallet: data.wallet,
                transactionType: transactionType,
                amounts: {
                    osmoFeeAmount: osmoFee.toNumber(),
                    userFiatAmount: totalFiatAmount.toNumber(),
                    userSatsAmount: data.amount,
                },
                balances: {
                    osmoFeeBalance: osmoWalletFee.availableBalance,
                    userFiatBalance: userFiatWallet.availableBalance,
                    userSatsBalance: userBtcWallet.availableBalance,
                },
                wallets: {
                    osmoFeeWallet: osmoWalletFee.id,
                    userFiatWallet: userFiatWallet.id,
                    userSatsWallet: userBtcWallet.id,
                },
                fiatToFiat: false,
                payload: data,
                user: authUser,
            };
            this.googleTasksService.createInternalTask(this.queue, body, this.url);
        });
    }

    async buy(authUser: AuthUser, data: SwapDto, fromCoin: Coin, fiatToFiat: boolean = false) {
        const feature = await this.featureRepository.findOneBy({
            name: TransactionType.SWAP,
        });

        if (!feature) throw new BadRequestException('Feature not found');
        const tierFeature = await this.featureService.getTierFeature(feature.id, authUser);
        if (!tierFeature) throw new BadRequestException('Tier feature not found');

        let fee = tierFeature.fee;
        fee = fiatToFiat ? new Decimal(fee).dividedBy(2).toNumber() : new Decimal(fee).toNumber();
        let btcPrice = data.btcPrice;
        const satCoin = await this.coinRepository.findOneBy({ acronym: CoinEnum.SATS });
        if (!satCoin) throw new BadRequestException('Invalid coin');

        await this.userRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [userFiatWallet, userBtcWallet, osmoWalletFee] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: data.fromCoinId, userId: authUser.sub }),
                findAndLockWallet({ entityManager: entityManager, coinId: satCoin.id, userId: authUser.sub }),
                findAndLockWallet({ entityManager: entityManager, coinId: data.fromCoinId, alias: MainWalletsAccount.FEES }),
            ]);
            if (!userBtcWallet || !userFiatWallet || !osmoWalletFee) throw new BadRequestException('Wallets not found');

            if (userFiatWallet.availableBalance < data.amount)
                throw new BadRequestException('Balance insuficiente para realizar esta transacción');

            btcPrice = new Decimal(btcPrice).mul(fromCoin.exchangeRate).toNumber();
            const amountBtc = new Decimal(data.amount).div(btcPrice).toFixed(8);
            const subtotalAmountSats = new Decimal(amountBtc).mul(Math.pow(10, 8));
            const totalAmountSats = new Decimal(subtotalAmountSats).sub(new Decimal(subtotalAmountSats).mul(fee)).divToInt(1);
            const osmoFee = new Decimal(data.amount).mul(fee).toDecimalPlaces(2);

            await Promise.all([
                entityManager.update(Wallet, osmoWalletFee.id, {
                    availableBalance: new Decimal(osmoWalletFee.availableBalance).add(osmoFee).toNumber(),
                    balance: new Decimal(osmoWalletFee.balance).add(osmoFee).toNumber(),
                }),
                entityManager.update(Wallet, userFiatWallet.id, {
                    availableBalance: new Decimal(userFiatWallet.availableBalance).sub(data.amount).toNumber(),
                    balance: new Decimal(userFiatWallet.balance).sub(data.amount).toNumber(),
                }),
                entityManager.update(Wallet, userBtcWallet.id, {
                    availableBalance: new Decimal(userBtcWallet.availableBalance).add(totalAmountSats).toNumber(),
                    balance: new Decimal(userBtcWallet.balance).add(totalAmountSats).toNumber(),
                }),
            ]);
            const body: SwapTransactionDto = {
                wallet: data.wallet,
                transactionType: TransactionType.SWAP,
                user: authUser,
                fiatToFiat: fiatToFiat,
                payload: data,
                amounts: {
                    osmoFeeAmount: osmoFee.toNumber(),
                    userFiatAmount: data.amount,
                    userSatsAmount: totalAmountSats.toNumber(),
                },
                balances: {
                    osmoFeeBalance: osmoWalletFee.availableBalance,
                    userFiatBalance: userFiatWallet.availableBalance,
                    userSatsBalance: userBtcWallet.availableBalance,
                },
                wallets: {
                    osmoFeeWallet: osmoWalletFee.id,
                    userFiatWallet: userFiatWallet.id,
                    userSatsWallet: userBtcWallet.id,
                },
            };
            this.googleTasksService.createInternalTask(this.queue, body, this.url);
        });
    }

    /// RECURRENT BUY

    async deleteRecurrentBuy(authUser: AuthUser, recurrentBuyId: string) {
        const record = await this.recurrentBuyRepository.findOneBy({
            id: recurrentBuyId,
            user: { id: authUser.sub },
        });
        if (!record) throw new BadRequestException('No tienes ningun registro con este Id');

        await this.recurrentBuyRepository.remove(record);
    }

    async getRecurrentBuys(authUser: AuthUser) {
        const recurrentBuyRecords = await this.recurrentBuyRepository.find({
            relations: { coin: true },
            where: { user: { id: authUser.sub } },
        });
        return recurrentBuyRecords;
    }

    async createRecurrentBuy(authUser: AuthUser, data: RecurrentBuyDto) {
        await this.featureService.checkFeatureAvailability(authUser,FeatureEnum.RECURRENT_BUY)
        try {
            const coin = await this.coinRepository.findOneBy({ id: data.coinId });
            if (!coin) throw new BadRequestException('Invalid coin');

            const feature = await this.featureRepository.findOneBy({
                name: TransactionType.RECURRENT_BUY,
            });
            if (!feature) throw new BadRequestException('Feature not found');

            const tierFeature = await this.featureService.getTierFeature(feature.id, authUser);

            const amount = data.amount / coin.exchangeRate;
            if (amount < tierFeature.min || amount > tierFeature.max) throw new BadRequestException('Out of limits');

            const btcPrice = await this.ibexService.getBtcExchangeRate();

            await this.buyRecurrentBuy({
                amount: data.amount,
                btcPrice: btcPrice.rate,
                coinId: coin.id,
                days: data.days,
                userId: authUser.sub,
            });

            const user = await this.userRepository.findOneBy({ id: authUser.sub });

            if (!user) throw new BadRequestException('User not found');

            const [hour, minutes] = data.time.split(':') as [string, string];
            const currentTime = new Date();
            currentTime.setHours(parseInt(hour));
            currentTime.setMinutes(parseInt(minutes));
            currentTime.setSeconds(0);
            currentTime.setMilliseconds(0);
            const timeString = this.convertFromDate(currentTime);

            const recurrentBuyRecord = this.recurrentBuyRepository.create({
                amount: data.amount,
                days: data.days,
                coin: coin,
                user: user,
                time: timeString,
            });
            await this.recurrentBuyRepository.save(recurrentBuyRecord, {
                reload: true,
            });
            return recurrentBuyRecord;
        } catch (error) {
            throw error;
        }
    }

    /// AUTOMATION
    async processRecurrentBuys() {
        const currentTime = new Date();
        const timeString = this.convertFromDate(currentTime);
        const records = await this.recurrentBuyRepository.find({
            relations: { user: true, coin: true },
            where: { time: timeString },
        });

        const finalRecords = records.filter(
            (record) => Math.abs(differenceInMinutes(this.convertFromString(record.time), currentTime)) % (record.days * 24 * 60) === 0,
        );

        if (finalRecords.length > 0) {
            const btcPrice = (await this.ibexService.getBtcExchangeRate()).rate;
            await Promise.all(
                finalRecords.map(({ amount, coin, user, days }) => this.addRecurrentBuyToQueue(amount, coin.id, user.id, days, btcPrice)),
            );
        }
    }

    /// TESTING QA
    async processRecurrentBuysTest(time: string) {
        const timeDate = this.convertFromString(time);
        const records = await this.recurrentBuyRepository.find({
            relations: { user: true, coin: true },
            where: { time },
        });

        const finalRecords = records.filter(
            (record) => Math.abs(differenceInMinutes(this.convertFromString(record.time), timeDate)) % (record.days * 24 * 60) === 0,
        );
        if (finalRecords.length > 0) {
            const btcPrice = (await this.ibexService.getBtcExchangeRate()).rate;
            await Promise.all(
                finalRecords.map(({ amount, coin, user, days }) => this.addRecurrentBuyToQueue(amount, coin.id, user.id, days, btcPrice)),
            );
        }
    }

    private async addRecurrentBuyToQueue(amount: number, coinId: string, userId: string, days: number, btcPrice: number) {
        const body: RecurrentBuyPayload = {
            amount: amount,
            btcPrice: btcPrice,
            coinId: coinId,
            days: days,
            userId: userId,
        };
        await this.googleTasksService.createInternalTask(this.recurrentBuyQueue, body, this.recurrentBuyUrl);
    }

    /// Manage wallets balances
    async buyRecurrentBuy(payload: RecurrentBuyPayload) {
        const feature = await this.featureRepository.findOneBy({
            name: TransactionType.RECURRENT_BUY,
        });
        if (!feature) throw new BadRequestException('Feature not found');
        const tierFeature = await this.featureService.getTierFeature(feature.id, { sub: payload.userId });
        const coin = await this.coinRepository.findOneBy({
            id: payload.coinId,
        });
        if (!coin) throw new BadRequestException('Coin not found');

        const fee = tierFeature.fee;
        let btcPrice = payload.btcPrice;
        let passed: boolean = false;
        const satCoin = await this.coinRepository.findOneBy({ acronym: CoinEnum.SATS });
        if (!satCoin) throw new BadRequestException('Invalid coin');

        await this.coinRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            btcPrice = Number(new Decimal(btcPrice).mul(coin.exchangeRate).toFixed(2));
            const amountBtc = new Decimal(payload.amount).div(btcPrice);
            const subtotalAmountSats = amountBtc.mul(Math.pow(10, 8)).toDecimalPlaces(2);
            const totalAmountSats = subtotalAmountSats.sub(subtotalAmountSats.mul(fee)).divToInt(1);
            const osmoFee = new Decimal(payload.amount).mul(fee).toDecimalPlaces(2);
            const [userFiatWallet, userBtcWallet, osmoWalletFee] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: payload.coinId, userId: payload.userId }),
                findAndLockWallet({ entityManager: entityManager, coinId: satCoin.id, userId: payload.userId }),
                findAndLockWallet({ entityManager: entityManager, coinId: payload.coinId, alias: MainWalletsAccount.FEES }),
            ]);
            if (!userFiatWallet || !userBtcWallet || !osmoWalletFee) throw new BadRequestException('Wallets not found');
            if (userFiatWallet.availableBalance >= payload.amount) {
                passed = true;
                await Promise.all([
                    entityManager.update(Wallet, osmoWalletFee.id, {
                        availableBalance: new Decimal(osmoWalletFee.availableBalance).plus(osmoFee).toNumber(),
                        balance: new Decimal(osmoWalletFee.balance).plus(osmoFee).toNumber(),
                    }),
                    entityManager.update(Wallet, userFiatWallet.id, {
                        availableBalance: new Decimal(userFiatWallet.availableBalance).minus(payload.amount).toNumber(),
                        balance: new Decimal(userFiatWallet.balance).minus(payload.amount).toNumber(),
                    }),
                    entityManager.update(Wallet, userBtcWallet.id, {
                        availableBalance: new Decimal(userBtcWallet.availableBalance).plus(totalAmountSats).toNumber(),
                        balance: new Decimal(userBtcWallet.balance).plus(totalAmountSats).toNumber(),
                    }),
                ]);
            }
            const body: RecurrentBuyTransactionData = {
                userId: payload.userId,
                coinId: payload.coinId,
                passed: passed,
                days: payload.days,
                balances: {
                    osmoWalletFeeBalance: osmoWalletFee.availableBalance,
                    userFiatBalance: userFiatWallet.availableBalance,
                    userSatsBalance: userBtcWallet.availableBalance,
                },
                amounts: {
                    osmoFiatFeeToCredit: osmoFee.toNumber(),
                    totalUserFiatToDebit: payload.amount,
                    totalUserSatsToCredit: totalAmountSats.toNumber(),
                },
                wallets: {
                    userFiatWallet: userFiatWallet.id,
                    osmoFeeWallet: osmoWalletFee.id,
                    userSatsWallet: userBtcWallet.id,
                },
                btcPrice: payload.btcPrice,
            };

            await this.googleTasksService.createInternalTask(this.recurrentBuyQueue, body, this.recurrentTransactionBuyUrl);
        });
    }

    /// Create only transactions
    async createRecurrentBuyTransactions(data: RecurrentBuyTransactionData) {
        const [user] = await Promise.all([
            this.userRepository.findOneBy({
                id: data.userId,
            }),
        ]);

        if (!user) throw new BadRequestException('User not found');

        const status: Status = data.passed ? Status.COMPLETED : Status.FAILED;

        if (data.passed) {
            const userAddresses = await this.addressModel.findOne({ user: data.userId });
            if (!userAddresses) return;

            const lnPayer = userAddresses.addresses.find((address) => address.type === Types.LNURL_PAYER);
            if (!lnPayer) throw new BadRequestException('LN Payer not found');

            const ibexNativeOsmoAccountId = this.configService.getOrThrow('IBEX_NATIVE_OSMO_ACCOUNT_ID');

            const lnURLDecode = ln.decode(lnPayer.address);
            const params = await this.ibexService.getParams(lnURLDecode);
            await this.ibexService.payLnURL(params, data.amounts.totalUserSatsToCredit * 1000, ibexNativeOsmoAccountId);
        }
        try {
            await this.coinRepository.manager.transaction(async (entityManager) => {
                const transactionGroup = entityManager.create(TransactionGroup, {
                    fromUser: { id: data.userId },
                    status: status,
                    transactionCoin: { id: data.coinId },
                    type: TransactionType.RECURRENT_BUY,
                    btcPrice: data.btcPrice,
                });
                await entityManager.insert(TransactionGroup, transactionGroup);
                const userFiatTransaction = entityManager.create(Transaction, {
                    transactionGroup: transactionGroup,
                    amount: data.amounts.totalUserFiatToDebit,
                    wallet: { id: data.wallets.userFiatWallet },
                    balance: data.balances.userFiatBalance,
                    subtype: TransactionSubtype.DEBIT_FIAT_BUY,
                });
                const userSatsTransaction = entityManager.create(Transaction, {
                    transactionGroup: transactionGroup,
                    amount: data.amounts.totalUserSatsToCredit,
                    wallet: { id: data.wallets.userSatsWallet },
                    balance: data.balances.userSatsBalance,
                    subtype: TransactionSubtype.CREDIT_BTC_BUY,
                });
                const osmoFeeTransaction = entityManager.create(Transaction, {
                    transactionGroup: transactionGroup,
                    amount: data.amounts.osmoFiatFeeToCredit,
                    wallet: { id: data.wallets.osmoFeeWallet },
                    balance: data.balances.osmoWalletFeeBalance,
                    subtype: TransactionSubtype.FEE_BUY,
                });
                await entityManager.insert(Transaction, [userFiatTransaction, userSatsTransaction, osmoFeeTransaction]);
                const fee = entityManager.create(TransactionFee, {
                    amount: data.amounts.osmoFiatFeeToCredit,
                    coin: { id: data.coinId },
                    transactionGroup: transactionGroup,
                });
                await entityManager.insert(TransactionFee, fee);
                let message = '⚠️ Tu compra recurrente no se efectuó por falta de saldo ⚠️';
                if (data.passed) {
                    const fromCoin = await this.coinRepository.findOneBy({
                        id: data.coinId,
                    });
                    if (!fromCoin) throw new BadRequestException('Coin not found');

                    message = `💸 Tu compra recurrente cada ${
                        data.days === 1 ? 'día' : 'días'
                    }  ha sido realizada con éxito por un monto de ${data.amounts.totalUserFiatToDebit.toFixed(2)} ${fromCoin.acronym} 💸`;
                }
                await this.pushNotificationService.sendPushToUser(user, {
                    title: 'Compra Recurrente',
                    message: message,
                    data: {
                        route: MobileRoutePaths.Transactions,
                    },
                });
            });
        } catch (error) {
            throw error;
        }
    }

    private convertFromDate(currentTime: Date) {
        currentTime.setUTCSeconds(0);
        currentTime.setUTCMilliseconds(0);
        const isoDate = currentTime.toISOString()?.split('T')[1]?.split('.')[0];
        return isoDate;
    }

    private convertFromString(timeString: string) {
        const [hours, minutes, seconds] = timeString.split(':') as [string, string, string];
        const time = new Date();
        time.setHours(+hours, +minutes, +seconds, 0);
        return time;
    }
}
