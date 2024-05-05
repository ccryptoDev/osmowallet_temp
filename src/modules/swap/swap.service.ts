import {
  BadGatewayException,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Coin } from 'src/entities/coin.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { IbexService } from '../ibex/ibex.service';
import { SwapDto } from './dtos/swap.dto';
import { CoinEnum } from '../me/enums/coin.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import * as ln from 'lnurl';
import { AuthUser } from '../auth/payloads/auth.payload';
import { Feature } from 'src/entities/feature.entity';
import { SwapTransactionDto } from './dtos/swapTransaction.dto';
import { TransactionFee } from 'src/entities/transactionFee.entity';
import { RecurrentBuy } from 'src/entities/recurrent.buy.entity';
import { RecurrentBuyPayload } from './dtos/recurrentBuyPayload.dto';
import { RecurrentBuyTransactionData } from './dtos/recurrentBuyTransactionData.dto';
import { Period } from 'src/entities/period.entity';
import { RecurrentBuyDto } from './dtos/recurrentBuy.dto';
import { WalletSwap } from './enums/swapWallet.enum';
import { Address } from 'src/entities/address.entity';
import { FeaturesService } from '../features/features.service';
import Decimal from 'decimal.js';
import { Status } from 'src/common/enums/status.enum';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { FeatureEnum } from 'src/common/enums/feature.enum';
import { AutoconvertTransaction } from './interfaces/autoconvertTransaction.interface';
import { AutoconvertToReceivePayload } from './interfaces/autoconvert.interface';
import { PushNotificationService } from '../push-notification/push-notification.service';
import MobileRoutePaths from '../push-notification/enums/mobileRoutesPaths.enum';
import { UpdateBalance } from '../balance-updater/interfaces/updateBalance';
import { BalanceUpdaterService } from '../balance-updater/balance-updater.service';
import { UpdateBalanceTransferType } from '../balance-updater/enums/type.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { TransactionsService } from '../transactions/transactions.service';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { Wallet } from 'src/entities/wallet.entity';

@Injectable()
export class SwapService {
  private queue = `SWAP-${process.env.ENV}`;
  private url = `https://${process.env.DOMAIN}/swap/create`;
  private recurrentBuyQueue = `SWAP-${process.env.ENV}`;
  private recurrentTransactionBuyUrl = `https://${process.env.DOMAIN}/swap/recurrent-buys/transactions-create`;
  private recurrentBuyUrl = `https://${process.env.DOMAIN}/swap/recurrent-buys/buy`;
  private autoconvertQueue = `AUTOCONVERT-${process.env.ENV}`
  private autoconvertUrl = `https://${process.env.DOMAIN}/swap/autoconvert`
  private autoconvertCreateUrl = `https://${process.env.DOMAIN}/swap/autoconvert-create`

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Coin) private coinRepository: Repository<Coin>,
    @InjectRepository(RecurrentBuy) private recurrentBuyRepository: Repository<RecurrentBuy>,
    @InjectRepository(Period) private periodRepository: Repository<Period>,
    @InjectRepository(Feature) private featureRepository: Repository<Feature>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
    private ibexService: IbexService,
    private googleTasksService: GoogleCloudTasksService,
    private pushNotificationService: PushNotificationService,
    private featureService: FeaturesService,
    private transactionService: TransactionsService
  ) {}

  addToBalanceUpdaterQueue(data: UpdateBalance){
    this.googleTasksService.createInternalTask(BalanceUpdaterService.queue,data,BalanceUpdaterService.url)
  }
  
  addAutoconvertToQueue(data: AutoconvertToReceivePayload) {
    this.googleTasksService.createInternalTask(this.autoconvertQueue,data, this.autoconvertUrl)
  }

  async createAutoconvertToReceiveTransaction(data: AutoconvertTransaction) {

    const toCoin = await this.coinRepository.findOneBy({id: data.payload.toCoinId})
    await this.userRepository.manager.transaction(async entityManager => {
      const transactionGroup = entityManager.create(TransactionGroup, {
        fromUser: { id: data.payload.authUser.sub },
        type: TransactionType.AUTOCONVERT,
        transactionCoin: {id: data.payload.toCoinId},
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
        coin: {id: data.payload.toCoinId},
        amount: data.amounts.osmoFeeToCredit,
        transactionGroup: transactionGroup,
      });
      await entityManager.save([
        creditOsmoFeeTransaction,
        userBtcCreditTransaction,
        userFiatCreditTransaction,
      ]);
      await entityManager.insert(TransactionFee, fee);
    });
    this.addToBalanceUpdaterQueue({
      amount: data.amounts.userFiatToCredit,
      coinId: data.payload.toCoinId,
      userId: data.payload.authUser.sub,
      type: UpdateBalanceTransferType.USER_TO_OSMO
    })
    const user = await this.userRepository.findOneBy({ id: data.payload.authUser.sub });
    this.pushNotificationService.sendPushToUser(user, {
      title: 'Autoconvert',
      message: `Se te acreditaron ${data.amounts.userFiatToCredit} a tu cuenta de ${toCoin.acronym}`,
      data: {
        currency: toCoin.acronym,
        amount: data.amounts.userFiatToCredit.toString()
      }
    });
    const lnURLDecode = ln.decode(process.env.IBEX_OSMO_LNURL_ADDRESS_PAYER);
    const params = await this.ibexService.getParams(lnURLDecode);
    const [ibexAccount] = await Promise.all([
      this.ibexAccountRepository.findOne({
        where:{
          user: { id: data.payload.authUser.sub },
        }
      }),
    ])
    await this.ibexService.payLnURL(params,data.payload.satsToSell * 1000,ibexAccount.account,);
  }


  async autoConvertToReceive(data: AutoconvertToReceivePayload) {
    const feature = await this.featureRepository.findOneBy({name: FeatureEnum.AUTOCONVERT});
    const tierFeature = await this.featureService.getTierFeature(feature.id,data.authUser)
    const fee = tierFeature.fee;
    let btcPrice = data.btcPrice;
    const toCoin = await this.coinRepository.findOneBy({id: data.toCoinId})
    const satsRemaining = new Decimal(data.totalSats).minus(data.satsToSell);
    await this.userRepository.manager.transaction('SERIALIZABLE', async entityManager => {
      const [userBtcWallet,userFiatWallet,osmoWalletFee] = await Promise.all([
        findAndLockWallet({entityManager: entityManager, coinId: data.fromCoinId,userId: data.authUser.sub}),
        findAndLockWallet({entityManager: entityManager, coinId: data.toCoinId,userId: data.authUser.sub}),
        findAndLockWallet({entityManager: entityManager, coinId: data.toCoinId, alias: MainWalletsAccount.FEES}),
      ])
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

  async swap(autUser: AuthUser, data: SwapDto) {
    await this.transactionService.checkTransactionRateLimit(autUser.sub, TransactionType.SWAP)
    const fromCoin = await this.coinRepository.findOneBy({
      id: data.fromCoinId,
    });
    const toCoin = await this.coinRepository.findOneBy({ id: data.toCoinId });
    if (!fromCoin || !toCoin) throw new BadGatewayException('Moneda no valida');
    if (fromCoin.id == toCoin.id)
      throw new BadGatewayException('No se puede swappear a la misma moneda');

    if (fromCoin.acronym == CoinEnum.SATS && toCoin.acronym != CoinEnum.SATS) {
      return this.sell(autUser, data, toCoin);
    }

    if (fromCoin.acronym != CoinEnum.SATS && toCoin.acronym == CoinEnum.SATS) {
      if (data.wallet == WalletSwap.OSMO) {
        return this.buy(autUser, data, fromCoin);
      }
    }

    if (fromCoin.acronym != CoinEnum.SATS && toCoin.acronym != CoinEnum.SATS) {
      return this.buy(autUser, data, fromCoin, true);
    }
  }

  async createTransactions(data: SwapTransactionDto) {
    const fromCoin = await this.coinRepository.findOneBy({
      id: data.payload.fromCoinId,
    });
    const toCoin = await this.coinRepository.findOneBy({
      id: data.payload.toCoinId,
    });
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
        where:{
          user: { id: data.user.sub },
        }
      }),
    ])

    const lnURLDecode = ln.decode(process.env.IBEX_OSMO_LNURL_ADDRESS_PAYER);
    const params = await this.ibexService.getParams(lnURLDecode);
    await this.ibexService.payLnURL(params,data.amounts.userSatsAmount * 1000,ibexAccount.account,);
    await this.userRepository.manager.transaction(async entityManager => {
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
      await entityManager.save([
        creditOsmoFeeTransaction,
        userCreditTransaction,
        userDebitTransaction,
      ]);
      await entityManager.insert(TransactionFee, fee);
      this.addToBalanceUpdaterQueue({
        amount: data.amounts.userFiatAmount,
        coinId: data.payload.toCoinId,
        userId: data.user.sub,
        type: UpdateBalanceTransferType.OSMO_TO_USER
      })
      const user = await this.userRepository.findOneBy({ id: data.user.sub });
      this.pushNotificationService.sendPushToUser(user, {
        title: 'Autoconvert',
        message: `Se te acreditaron ${data.amounts.userFiatAmount} a tu cuenta de ${toCoin.acronym}`,
      });

    });
  }

  async createBuyTransaction(data: SwapTransactionDto, fromCoin: Coin) {
    const [ user, userAddresses ] = await Promise.all([
      this.userRepository.findOneBy({id: data.user.sub}),
      this.addressRepository.findOne({
        where: { user: {
          id: data.user.sub
        } }
      })
    ])
    const lnURLDecode = ln.decode(userAddresses.lnUrlPayer);
    const params = await this.ibexService.getParams(lnURLDecode);
    await this.ibexService.payLnURL(params,data.amounts.userSatsAmount * 1000,process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID);
    
    await this.userRepository.manager.transaction(async entityManager => {
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

      await entityManager.insert(Transaction, [
        creditOsmoFeeTransaction,
        userDebitTransaction,
        userCreditTransaction,
      ]);

      await entityManager.insert(TransactionFee, fee);
      this.addToBalanceUpdaterQueue({
        amount: data.amounts.userFiatAmount,
        coinId: data.payload.fromCoinId,
        userId: data.user.sub,
        type: UpdateBalanceTransferType.USER_TO_OSMO
      })
    });
    if (data.fiatToFiat) {
      fromCoin = await this.coinRepository.findOneBy({acronym: CoinEnum.SATS,});
      const toCoin = await this.coinRepository.findOneBy({id: data.payload.toCoinId,});
      this.sell(data.user,{
          amount: data.amounts.userSatsAmount,
          btcPrice: data.payload.btcPrice,
          fromCoinId: fromCoin.id,
          toCoinId: data.payload.toCoinId,
          wallet: WalletSwap.OSMO,
        },
        toCoin,
        data.fiatToFiat
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
    console.log('SWAP: ', data)
    if (!Number.isInteger(data.amount)) throw new BadRequestException('Amount must be an integer');
    
    const feature = await this.featureRepository.findOneBy({
      name: transactionType
    });
    const tierFeature = await this.featureService.getTierFeature(feature.id,authUser)
    let fee = tierFeature.fee;
    fee = fiatToFiat ? new Decimal(fee).dividedBy(2).toNumber() : new Decimal(fee).toNumber()
    let btcPrice = data.btcPrice;
    await this.userRepository.manager.transaction('SERIALIZABLE',async entityManager => {
      const [userBtcWallet,userFiatWallet,osmoWalletFee] = await Promise.all([
        findAndLockWallet({entityManager: entityManager, coinId: data.fromCoinId, userId: authUser.sub}),
        findAndLockWallet({entityManager: entityManager, coinId: data.toCoinId, userId: authUser.sub}),
        findAndLockWallet({entityManager: entityManager, coinId: data.toCoinId, alias: MainWalletsAccount.FEES}),
      ])

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

  async buy(
    authUser: AuthUser,
    data: SwapDto,
    fromCoin: Coin,
    fiatToFiat: boolean = false,
  ) {
    const feature = await this.featureRepository.findOneBy({
      name: TransactionType.SWAP,
    });
    
    const tierFeature = await this.featureService.getTierFeature(feature.id,authUser)
    let fee = tierFeature.fee;
    fee = fiatToFiat ? new Decimal(fee).dividedBy(2).toNumber() : new Decimal(fee).toNumber()
    let btcPrice = data.btcPrice;
    const satCoin = await this.coinRepository.findOneBy({acronym: CoinEnum.SATS})
    await this.userRepository.manager.transaction('SERIALIZABLE',async entityManager => {
      const [userFiatWallet,userBtcWallet,osmoWalletFee] = await Promise.all([
        findAndLockWallet({entityManager: entityManager, coinId: data.fromCoinId,userId: authUser.sub}),
        findAndLockWallet({entityManager: entityManager, coinId: satCoin.id,userId: authUser.sub}),
        findAndLockWallet({entityManager: entityManager, coinId: data.fromCoinId, alias: MainWalletsAccount.FEES}),
      ])
      if (userFiatWallet.availableBalance < data.amount) throw new BadRequestException('Balance insuficiente para realizar esta transacción',);

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
    if (!record)
      throw new BadRequestException('No tienes ningun registro con este Id');

    await this.recurrentBuyRepository.remove(record);
  }

  async getRecurrentBuys(authUser: AuthUser) {
    return await this.recurrentBuyRepository.find({
      relations: { coin: true, period: true },
      where: { user: { id: authUser.sub } },
    });
  }

  async createRecurrentBuy(authUser: AuthUser, data: RecurrentBuyDto) {
    try {
      const coin = await this.coinRepository.findOneBy({ id: data.coinId });
      if (!coin) throw new BadRequestException('Invalid coin');
      const period = await this.periodRepository.findOneBy({
        id: data.periodId,
      });
      if (!period) throw new BadRequestException('Invalid period');

      const feature = await this.featureRepository.findOneBy({
        name: TransactionType.RECURRENT_BUY,
      });
      const tierFeature = await this.featureService.getTierFeature(feature.id,authUser)

      const amount = data.amount / coin.exchangeRate;
      if (amount < tierFeature.min || amount > tierFeature.max)
        throw new BadRequestException('Out of limits');
      const btcPrice = await this.ibexService.getBtcExchangeRate();
      await this.buyRecurrentBuy({
        amount: data.amount,
        btcPrice: btcPrice.rate,
        coinId: coin.id,
        periodId: period.id,
        userId: authUser.sub,
      });
      const user = await this.userRepository.findOneBy({ id: authUser.sub });
      const currentTime = new Date();
      currentTime.setUTCSeconds(0);
      currentTime.setUTCMilliseconds(0);
      const timeString = currentTime.toISOString().split('T')[1].split('.')[0];
      const recurrentBuyRecord = this.recurrentBuyRepository.create({
        amount: data.amount,
        period: period,
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
    currentTime.setUTCSeconds(0);
    currentTime.setUTCMilliseconds(0);
    const timeString = currentTime.toISOString().split('T')[1].split('.')[0];
    const records = await this.recurrentBuyRepository.find({
      relations: { user: true, period: true, coin: true },
      where: { time: timeString },
    });
    this.filterRecurrentBuys(records, currentTime);
  }

  private filterByPeriod(
    record: RecurrentBuy,
    currentDate: Date,
    days: number,
  ) {
    const msInDay = 24 * 60 * 60 * 1000;
    const forceDate = record.createdAt;
    forceDate.setSeconds(0);
    forceDate.setMilliseconds(0);
    const diffInDays = Math.round(
      Math.abs(currentDate.getTime() - forceDate.getTime()) / msInDay,
    );
    if (diffInDays % days == 0) {
      return true;
    }
    return false;
  }

  private async filterRecurrentBuys(
    records: Array<RecurrentBuy>,
    currentDate: Date,
  ) {
    const finalRecords: RecurrentBuy[] = [];

    const daily = records.filter((record) => record.period.name == '1 days');
    const weekly = records.filter(
      (record) =>
        record.period.name == '7 days' &&
        this.filterByPeriod(record, currentDate, 7),
    );
    const fifteenDays = records.filter(
      (record) =>
        record.period.name == '15 days' &&
        this.filterByPeriod(record, currentDate, 15),
    );
    const monthly = records.filter(
      (record) =>
        record.period.name == '30 days' &&
        this.filterByPeriod(record, currentDate, 30),
    );

    finalRecords.push(...daily);
    finalRecords.push(...weekly);
    finalRecords.push(...fifteenDays);
    finalRecords.push(...monthly);
    if (finalRecords.length > 0) {
      const btcPrice = (await this.ibexService.getBtcExchangeRate()).rate;
      await Promise.all(
        finalRecords.map((record) =>
          this.addRecurrentBuyToQueue(
            record.amount,
            record.coin.id,
            record.user.id,
            record.period.id,
            btcPrice,
          ),
        ),
      );
    }
  }

  private async addRecurrentBuyToQueue(
    amount: number,
    coinId: string,
    userId: string,
    periodId: string,
    btcPrice: number,
  ) {
    const body: RecurrentBuyPayload = {
      amount: amount,
      btcPrice: btcPrice,
      coinId: coinId,
      periodId: periodId,
      userId: userId,
    };
    this.googleTasksService.createInternalTask(
      this.recurrentBuyQueue,
      body,
      this.recurrentBuyUrl,
    );
  }

  /// Manage wallets balances
  async buyRecurrentBuy(payload: RecurrentBuyPayload) {
    const feature = await this.featureRepository.findOneBy({
      name: TransactionType.RECURRENT_BUY,
    });
    const tierFeature = await this.featureService.getTierFeature(feature.id,{sub: payload.userId})
    const coin = await this.coinRepository.findOneBy({
      id: payload.coinId,
    });
    const fee = tierFeature.fee;
    let btcPrice = payload.btcPrice;
    let passed: boolean = false;
    const satCoin = await this.coinRepository.findOneBy({acronym: CoinEnum.SATS})
    await this.coinRepository.manager.transaction('SERIALIZABLE',async entityManager => {
      btcPrice = Number(new Decimal(btcPrice).mul(coin.exchangeRate).toFixed(2));
      const amountBtc = new Decimal(payload.amount).div(btcPrice);
      const subtotalAmountSats = amountBtc.mul(Math.pow(10, 8)).toDecimalPlaces(2);
      const totalAmountSats = subtotalAmountSats.sub(subtotalAmountSats.mul(fee)).divToInt(1);
      const osmoFee = new Decimal(payload.amount).mul(fee).toDecimalPlaces(2);
      const [userFiatWallet,userBtcWallet,osmoWalletFee] = await Promise.all([
        findAndLockWallet({entityManager: entityManager, coinId: payload.coinId, userId: payload.userId}),
        findAndLockWallet({entityManager: entityManager, coinId: satCoin.id, userId: payload.userId}),
        findAndLockWallet({entityManager: entityManager, coinId: payload.coinId, alias: MainWalletsAccount.FEES})
      ])
      if (userFiatWallet.availableBalance >= payload.amount) {
        passed = true;
        const osmoWalletFeeUpdate = entityManager.update(Wallet, osmoWalletFee.id, {
          availableBalance: new Decimal(osmoWalletFee.availableBalance).plus(osmoFee).toNumber(),
          balance: new Decimal(osmoWalletFee.balance).plus(osmoFee).toNumber(),
        });

        const userFiatWalletUpdate = entityManager.update(Wallet, userFiatWallet.id, {
          availableBalance: new Decimal(userFiatWallet.availableBalance).minus(payload.amount).toNumber(),
          balance: new Decimal(userFiatWallet.balance).minus(payload.amount).toNumber(),
        });

        const userBtcWalletUpdate = entityManager.update(Wallet, userBtcWallet.id, {
          availableBalance: new Decimal(userBtcWallet.availableBalance).plus(totalAmountSats).toNumber(),
          balance: new Decimal(userBtcWallet.balance).plus(totalAmountSats).toNumber(),
        });

        await Promise.all([
          osmoWalletFeeUpdate,
          userFiatWalletUpdate,
          userBtcWalletUpdate,
        ]);
      }
      const body: RecurrentBuyTransactionData = {
        userId: payload.userId,
        coinId: payload.coinId,
        passed: passed,
        periodId: payload.periodId,
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

      this.googleTasksService.createInternalTask(
        this.recurrentBuyQueue,
        body,
        this.recurrentTransactionBuyUrl,
      );
    });
  }

  


  /// Create only transactions
  async createRecurrentBuyTransactions(data: RecurrentBuyTransactionData) {

    const [user] = await Promise.all([
      this.userRepository.findOneBy({
        id: data.userId
      }),
    ])
    const status: Status = data.passed ? Status.COMPLETED : Status.FAILED

    if (data.passed) {
      const userAddresses = await this.addressRepository.findOne({
        where: {
          user: { id: data.userId },
        },
      });
      if(!userAddresses) return;
      const lnURLDecode = ln.decode(userAddresses.lnUrlPayer);
      const params = await this.ibexService.getParams(lnURLDecode);
      await this.ibexService.payLnURL(
        params,
        data.amounts.totalUserSatsToCredit * 1000,
        process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID,
      );
    }
    try {
      await this.coinRepository.manager.transaction(async entityManager => {
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
        await entityManager.insert(Transaction, [
          userFiatTransaction,
          userSatsTransaction,
          osmoFeeTransaction,
        ]);
        const fee = entityManager.create(TransactionFee, {
          amount: data.amounts.osmoFiatFeeToCredit,
          coin: { id: data.coinId },
          transactionGroup: transactionGroup,
        });
        await entityManager.insert(TransactionFee, fee);
        let message =
          '⚠️ Tu compra recurrente no se efectuó por falta de saldo ⚠️';
        if (data.passed) {
          const fromCoin = await this.coinRepository.findOneBy({
            id: data.coinId,
          });
          const period = await this.periodRepository.findOneBy({
            id: data.periodId,
          });
          message = `💸 Tu compra recurrente ${this.getPeriod(
            period,
          )} ha sido realizada con éxito por un monto de ${data.amounts.totalUserFiatToDebit.toFixed(
            2,
          )} ${fromCoin.acronym} 💸`;
        }
        this.pushNotificationService.sendPushToUser(user, {
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

  private getPeriod(period: Period) {
    switch (period.name) {
      case '1 days':
        return 'daily';
      case '7 days':
        return 'weekly';
      case '15 days':
        return 'biweekly';
      case '30 days':
        return 'monthly';
    }
  }
}