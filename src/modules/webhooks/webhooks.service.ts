import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Autoconvert } from 'src/entities/autoconvert.entity';
import { TransactionDetail } from 'src/entities/transaction.detail.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { Repository } from 'typeorm';
import { LightningInvoiceDto } from './dtos/receiveInvoice.dto';
import { PayingInvoiceDto } from './dtos/payingInvoice.dto';
import { IbexStatuses, OnChainStatuses } from './enums/statuses.enum';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { CoinEnum } from '../me/enums/coin.enum';
import { User } from 'src/entities/user.entity';
import { IbexService } from '../ibex/ibex.service';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { Coin } from 'src/entities/coin.entity';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { TransactionFee } from 'src/entities/transactionFee.entity';
import { SwapService } from '../swap/swap.service';
import { Feature } from 'src/entities/feature.entity';
import { OsmoBusinessBpt } from 'src/entities/osmoBusinessBPT.entity';
import { IbexPayingQueryDto } from './dtos/query.dto';
import { CreateTransaction } from '../send/dtos/transaction.dto';
import { SendService } from '../send/send.service';
import { v4 as uuidv4 } from 'uuid';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { FeaturesService } from '../features/features.service';
import Decimal from 'decimal.js';
import { Status } from 'src/common/enums/status.enum';
import { SendGloballyService } from '../send-globally/send-globally.service';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import MobileRoutePaths from '../push-notification/enums/mobileRoutesPaths.enum';
import { PushNotificationService } from '../push-notification/push-notification.service';
import { UpdateBalance } from '../balance-updater/interfaces/updateBalance';
import { BalanceUpdaterService } from '../balance-updater/balance-updater.service';
import { UpdateBalanceTransferType } from '../balance-updater/enums/type.enum';
import { TransactionSubtype } from 'src/common/enums/transactionSubtype.enum';
import { OnChainTransactionDto } from './dtos/onchain.dto';
import { Preference } from 'src/entities/preference.entity';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { CurrencyEnum } from '../ibex/enum/currencies.enum';
import { Wallet } from 'src/entities/wallet.entity';

@Injectable()
export class WebhooksService {


  constructor(
    @InjectRepository(Autoconvert) private autconvertRepository: Repository<Autoconvert>,
    @InjectRepository(Transaction) private transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionDetail) private transactionDetailRepository: Repository<TransactionDetail>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Coin) private coinRepository: Repository<Coin>,
    @InjectRepository(Feature) private featureRepository: Repository<Feature>,
    @InjectRepository(TransactionGroup) private transactionGroupRepository: Repository<TransactionGroup>,
    @InjectRepository(TransactionFee) private feeRepository: Repository<TransactionFee>, 
    @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
    @InjectRepository(HistoricRate) private historicRateRepository: Repository<HistoricRate>,
    @InjectRepository(OsmoBusinessBpt) private osmoBusinessBptRepository: Repository<OsmoBusinessBpt>,
    @InjectRepository(TransactionFee) private transactionFeeRepository: Repository<TransactionFee>,
    @InjectRepository(Preference) private preferenceRepository: Repository<Preference>,
    private ibexService: IbexService,
    private pushNotificationService: PushNotificationService,
    private swapService: SwapService,
    private sendService: SendService,
    private featureService: FeaturesService,
    private googleCloudTaskService: GoogleCloudTasksService,
  ) {}

  // Autoconvert to Receive
  async sellAutoconvertToSend(user: User, amountSats: number) : Promise<boolean> {
    const autoconvertRecord = await this.autconvertRepository.findOne({
      relations: { coin: true },
      where: { user: { id: user.id } },
    });
    let percent = 0;
    if (autoconvertRecord.isActive) {
      percent = autoconvertRecord.percent / 100;
    }
    if (autoconvertRecord) {
      if (autoconvertRecord.isActive) {
        const feature = await this.featureRepository.findOneBy({name: TransactionType.AUTOCONVERT,});
        const tierFeature = await this.featureService.getTierFeature(feature.id,{sub: user.id})
        const btcPrice = (await this.ibexService.getBtcExchangeRate()).rate;
        const fromCoin = await this.coinRepository.findOneBy({acronym: CoinEnum.SATS,});
        const satsToSell = new Decimal(amountSats).times(percent).floor();
        const amountUsd = new Decimal(satsToSell).dividedBy(Math.pow(10, 8)).times(btcPrice);
        if (amountUsd.greaterThanOrEqualTo(tierFeature.min)) {
          this.swapService.addAutoconvertToQueue({
            authUser: { sub: user.id },
            btcPrice: btcPrice,
            fromCoinId: fromCoin.id,
            satsToSell: satsToSell.toNumber(),
            toCoinId: autoconvertRecord.coin.id,
            totalSats: amountSats
          })
          return false
        } else {
          this.pushNotificationService.sendPushToUser(user, {
            message:'No se pudo ejecutar autoconvert por limite de transaccion',
            title: 'Autoconvert',
            data: {
              route: MobileRoutePaths.Transactions,
            }
          });
          return true
        }
      }
      return true
    }
  }


  //ONCHAIN
  async receiveOnChain(data: OnChainTransactionDto, currency: CurrencyEnum) {
    if (data.webhookSecret != process.env.IBEX_WEBHOOK_SECRET) throw new UnauthorizedException();
    const ibexAcount = await this.ibexAccountRepository.findOne({
      relations: {
        user: true
      },
      where: {
        account: data.transaction.accountId
      }
    })
    const user = ibexAcount.user
    if (!user) throw new BadRequestException('User Not Found');
    switch (data.status) {
      case OnChainStatuses.CONFIRMED:
          this.sellAutoconvertToSend(user,data.amountSat).then((async response => {
            if(response) this.createFullOnChainTransactionReceive(user, data)
            const userPreference = await this.preferenceRepository.findOne({
              where: {
                user: {id: user.id}
              }
            }) 
            if(userPreference.dynamicOnchainAddress) this.ibexService.createOnchainAddress(data.transaction.accountId, currency)
          }))
        break;
      case OnChainStatuses.MEMPOOL: 
        this.pushNotificationService.sendPushToUser(user, {
          message: `Una transacción ${data.amountSat} SATS viene en camino! pronto te daremos actualización`,
          title: 'Recepción',
          data: {
            route: MobileRoutePaths.Transactions,
          }
        });
        break;
      case OnChainStatuses.BLOCKCHAIN:
        this.pushNotificationService.sendPushToUser(user, {
          message: `Tu recepción de bitcoin de ${data.amountSat} SATS ha entrado a la blockchain`,
          title: 'Recepción',
          data: {
            route: MobileRoutePaths.Transactions,
          }
        });
        break;
      case OnChainStatuses.FAILED:
        this.pushNotificationService.sendPushToUser(user, {
          message: `Tu recepción de bitcoin de ${data.amountSat} SATS ha fallado`,
          title: 'Recepción',
        });
        break;
    }
  }

  private async createFullOnChainTransactionReceive(user: User, data: OnChainTransactionDto) {
    const btcPriceResponse = await this.ibexService.getBtcExchangeRate();
    const btcPrice = btcPriceResponse.rate;
    const lastHistoricRate = (await this.historicRateRepository.find({order: { id: 'DESC' },take: 1,}))[0];
    const coin = await this.coinRepository.findOneBy({acronym: CoinEnum.SATS,});
    delete data.webhookSecret
    await this.transactionRepository.manager.transaction(async entityManager => {
      const transactionGroup = entityManager.create(TransactionGroup, {
        toUser: user,
        status: Status.COMPLETED,
        type: TransactionType.RECEPTION,
        transactionCoin: coin,
        historicRate: lastHistoricRate,
        btcPrice: btcPrice,
        metadata: data
      });
      await entityManager.insert(TransactionGroup, transactionGroup);
      const btcWallet = await findAndLockWallet({entityManager: entityManager, coinId: coin.id, userId: user.id})

      const updatedAvailableBalance = new Decimal(btcWallet.availableBalance).plus(data.amountSat).toNumber();
      const updatedBalance = new Decimal(btcWallet.balance).plus(data.amountSat).toNumber();
      await entityManager.update(Wallet, btcWallet.id, { availableBalance: updatedAvailableBalance, balance: updatedBalance });
      const transaction = entityManager.create(Transaction, {
        amount: data.amountSat,
        wallet: btcWallet,
        subtype: TransactionSubtype.CREDIT_BTC_TRANSFER_ONCHAIN,
        balance: btcWallet.availableBalance,
        transactionGroup: {id: transactionGroup.id}
      });
      await entityManager.insert(Transaction,transaction);
      const transactionDetail = entityManager.create(TransactionDetail, {
        transaction: transaction,
        ibexTransactionId: data.transaction.id,
        metadata: data,
      });
      await entityManager.insert(TransactionDetail,transactionDetail);
    });
    this.pushNotificationService.sendPushToUser(user, {
      message: `Acabas de recibir ${data.amountSat} SATS`,
      title: 'Recepción',
      data: {
        route: MobileRoutePaths.Transactions,
      }
    });
  }

  async payingOnchain(
    data: OnChainTransactionDto,
  ) {
    if (data.webhookSecret != process.env.IBEX_WEBHOOK_SECRET) throw new UnauthorizedException();
    const ibexAcount = await this.ibexAccountRepository.findOne({
      relations: {
        user: true
      },
      where: {
        account: data.transaction.accountId
      }
    })
    const user = ibexAcount.user
    const transactionGroup = await this.transactionGroupRepository.findOne({
      where: {
        transactions: {
          transactionDetail: {
            ibexTransactionId: data.transactionId,
          }
        }
      }
    })
    // const transactionDetail = await this.transactionDetailRepository.findOne({
    //   relations: { transaction: { transactionGroup: true } },
    //   where: {
    //     ibexTransactionId: data.transactionId,
    //   },
    // });
    // if (transactionDetail) {
    //   if (data.status == OnChainStatuses.CONFIRMED && transactionDetail.transaction.transactionGroup.status == Status.PENDING) {
    //     this.updateOnChainTransactionSend(user, data, feeSats);
    //   }
    //   if (data.status == OnChainStatuses.MEMPOOL) {
    //     this.transactionDetailRepository.update(transactionDetail.id, {metadata: data,});
    //     this.pushNotificationService.sendPushToUser(user, {
    //       message: `Tu envío de bitcoin de ${data.amountSat} SATS va en camino`,
    //       title: 'Envío',
    //       route: MobileRoutePaths.Transactions,
    //     });
    //   }
    // }
    switch (data.status) {
      case OnChainStatuses.CONFIRMED:
        this.updateOnChainTransactionSend(user, data);
        break;
      case OnChainStatuses.MEMPOOL:
        delete data.webhookSecret
        await this.transactionGroupRepository.update(transactionGroup.id, {metadata: data,});
        this.pushNotificationService.sendPushToUser(user, {
          message: `Tu envío de bitcoin de ${data.amountSat} SATS ha entrado a la blockchain`,
          title: 'Envío',
          data: {
            route: MobileRoutePaths.Transactions,
          }
        });
      case OnChainStatuses.BLOCKCHAIN:
        this.pushNotificationService.sendPushToUser(user, {
          message: `Tu envío de bitcoin de ${data.amountSat} SATS ha entrado a la blockchain`,
          title: 'Envío',
          data: {
            route: MobileRoutePaths.Transactions,
          }
        });
        break;
      case OnChainStatuses.FAILED:
        const queryPayload: IbexPayingQueryDto = {
          transactionGroupId: transactionGroup.id,
        }
        this.prepareDataToRefund(queryPayload,data.amountSat)
        this.pushNotificationService.sendPushToUser(user, {
          message: `Tu envío de bitcoin de ${data.amountSat} SATS ha fallado`,
          title: 'Envío',
        });
        break;
    }
  }

  private async updateOnChainTransactionSend(user: User,data: OnChainTransactionDto) {
    const transactionDetail = await this.transactionDetailRepository.findOne({
        relations: { transaction: true },
        where: {
          ibexTransactionId: data.transactionId,
        },
      },
    );
    const transaction = await this.transactionRepository.findOne({
      relations: {
        transactionDetail: true,
        transactionGroup: true,
      },
      where: { id: transactionDetail.transaction.id },
    });
    const transactionGroup = await this.transactionGroupRepository.findOne({
        relations: {
          transactionCoin: true,
          transactions: true
        },
        where: {
          id: transaction.transactionGroup.id,
        },
      },
    );
    await this.transactionRepository.manager.transaction(async entityManager => {
      if (transactionDetail) {
        await entityManager.update(TransactionGroup,transactionGroup.id , {
          status: Status.COMPLETED,
        })
      }
      this.pushNotificationService.sendPushToUser(user, {
        message: `Tu envío de bitcoin de ${data.amountSat} SATS se ha realizado con éxito`,
        title: 'Envío',
        data: {
          route: MobileRoutePaths.Transactions,
          currency: CoinEnum.SATS,
          amount: data.amountSat.toString()
        }
      });
    });
    if(transactionGroup.transactionCoin.acronym != CoinEnum.SATS){
      const transaccion = transactionGroup.transactions.find(t => t.subtype == 'debit-fiat-buy')
      this.addToBalanceUpdaterQueue({
        amount: transaccion.amount,
        coinId: transactionGroup.transactionCoin.id,
        type: UpdateBalanceTransferType.USER_TO_OSMO,
        userId: user.id
      })
    }
    
  }

  //LIGHTNING

  async payingInvoice(query: IbexPayingQueryDto, data: PayingInvoiceDto) {
    
    if (data.webhookSecret != process.env.IBEX_WEBHOOK_SECRET) throw new UnauthorizedException();
    
    const user = (await this.transactionGroupRepository.findOne({
      relations: {fromUser: true},
      where: {
        id: query.transactionGroupId
      }
    })).fromUser

    if (data.transaction.payment.status.name == IbexStatuses.FAILED) {
      const amountSats = data.transaction.payment.amountMsat / 1000
      this.prepareDataToRefund(query, amountSats);
    }
    if (data.transaction.payment.status.name == IbexStatuses.IN_FLIGHT) {
      console.log('INFLIGHT');
      // if (!transactionDetail && !transactionGroupIdExists) {
      //   this.createPartialLightningTransaction(user, data);
      // }
    }
    if (data.transaction.payment.status.name == IbexStatuses.SUCCEEDED) {
      this.createSendGloballyTask(data.transaction.payment.bolt11)
      this.createFeeRecordLeft(query, data, user);
    }
  }

  async createFeeRecordLeft(query: IbexPayingQueryDto, data: PayingInvoiceDto, user: User) {
    const coin = await this.coinRepository.findOneBy({
      acronym: CoinEnum.SATS,
    });
    const feeAmount = new Decimal(data.transaction.payment.feeMsat).dividedBy(1000).toNumber();

    let satsRemainder = new Decimal(0)
    const transaction = await this.transactionRepository.findOne({
      where: [
        {
          transactionGroup: {id: query.transactionGroupId},
          subtype: TransactionSubtype.DEBIT_BTC_TRANSFER_LN
        },
        {
          transactionGroup: {id: query.transactionGroupId},
          subtype: TransactionSubtype.DEBIT_BTC_TRANSFER_IBEXPAY
        }
      ]
    })
    const transactionGroup = await this.transactionGroupRepository.findOne({
      relations: {
        transactionCoin: true,
        transactions: true
      },
      where: {
        id: query.transactionGroupId,
      }
    })

    const networkFee = await this.transactionFeeRepository.findOne({
      where: {
        transactionGroup: {id: transactionGroup.id},
        coin: {acronym: CoinEnum.SATS}
      }
    })

    satsRemainder = new Decimal(networkFee.amount).minus(feeAmount)
    await this.userRepository.manager.transaction(async entityManager => {
      const wallet = await findAndLockWallet({entityManager: entityManager, coinId: coin.id,userId: user.id})
      let updatedAvailableBalance;
      let updatedBalance;

      if(coin.acronym == CoinEnum.SATS) {
        updatedAvailableBalance = new Decimal(wallet.availableBalance).minus(feeAmount).toNumber();
        updatedBalance = new Decimal(wallet.balance).minus(feeAmount).toNumber();
      } else {
        if(satsRemainder.greaterThanOrEqualTo(0)){
          updatedAvailableBalance = new Decimal(wallet.availableBalance).plus(satsRemainder).toNumber();
          updatedBalance = new Decimal(wallet.balance).plus(satsRemainder).toNumber();
        } else {
          updatedAvailableBalance = new Decimal(wallet.availableBalance).minus(satsRemainder).toNumber();
          updatedBalance = new Decimal(wallet.balance).minus(satsRemainder).toNumber();
        }
      }

      await entityManager.update(Wallet, wallet.id, { availableBalance: updatedAvailableBalance, balance: updatedBalance });
      await entityManager.update(TransactionFee,networkFee.id,{
        amount: feeAmount
      })
      await entityManager.update(Transaction,transaction.id,{
        balance: wallet.availableBalance,
      })
    })
    if(transactionGroup.transactionCoin.acronym != CoinEnum.SATS){
      const transaccion = transactionGroup.transactions.find(t => t.subtype == 'debit-fiat-buy')
      this.addToBalanceUpdaterQueue({
        amount: transaccion.amount,
        coinId: transactionGroup.transactionCoin.id,
        type: UpdateBalanceTransferType.USER_TO_OSMO,
        userId: user.id
      })
    }
  }

  addToBalanceUpdaterQueue(data: UpdateBalance){
    this.googleCloudTaskService.createInternalTask(BalanceUpdaterService.queue,data,BalanceUpdaterService.url)
  }

  async prepareDataToRefund(query: IbexPayingQueryDto, amount: number) {
    const transactionGroupIdExists = query.transactionGroupId != null || query.transactionGroupId != undefined;
    let transactionGroup: TransactionGroup;
    if (transactionGroupIdExists) {
      transactionGroup = await this.transactionGroupRepository.findOne({
        relations: {
          fromUser: true,
          transactionCoin: true,
          transactions: true,
        },
        where: {
          id: query.transactionGroupId,
        },
      });
      const fiatTransaction = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.DEBIT_FIAT_BUY,);
      const feeTransaction = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.FEE_BUY,);
      const satsTransaction = transactionGroup.transactions.find((t) => t.subtype == TransactionSubtype.DEBIT_BTC_TRANSFER_LN);
      const refundData: CreateTransaction = {
        id: uuidv4(),
        amounts: {
          osmoFiatFeeToCredit: feeTransaction ? feeTransaction.amount : 0,
          totalUserBtcToDebit: satsTransaction ? satsTransaction.amount : 0,
          totalUserFiatToDebit: fiatTransaction ? fiatTransaction.amount : 0,
        },
        balances: {
          osmoWalletFeeBalance: 0,
          userFiatBalance: 0,
          userSatsBalance: 0,
        },
        btcPrice: 0,
        wallets: {
          osmoFeeWallet: '',
          userFiatWallet: '',
          userSatsWallet: '',
        },
        payload: {
          amount: amount,
          address: '',
          btcPrice: 0,
          feeSat: 0,
          coinId: transactionGroup.transactionCoin.id,
        },
        user: {
          sub: transactionGroup.fromUser.id,
        },
      };
      this.sendService.addRefundTransactonToQueue({createSendTransaction: refundData,transactionGroupId: transactionGroup.id, refundToOsmo: true});
    }
  }

  async storeLnReceivedMSat(data: LightningInvoiceDto, currency: CurrencyEnum) {
    if (data.webhookSecret != process.env.IBEX_WEBHOOK_SECRET) throw new UnauthorizedException();
    const accountId = data.transaction.accountId;
    const ibexAccount = await this.ibexAccountRepository.findOne({
      relations: {
        user: true,
      },
      where: {
        account: accountId,
      },
    });
    const user = ibexAccount.user;
    if (!user) throw new BadRequestException('User not found');
    const sats = new Decimal(data.receivedMsat).dividedBy(1000).floor().toNumber();
    this.sellAutoconvertToSend(user, sats).then((response => {
      if(response) this.storeSats(user,sats,data)
    }))
  }


  private async createSendGloballyTask(address: string) {
    this.googleCloudTaskService.createInternalTask(
      SendGloballyService.queue,{
        address: address
      },
      SendGloballyService.url,
    )
  }


  private async storeSats(user: User,amount: number,data: LightningInvoiceDto): Promise<TransactionGroup> {
    const btcPrice = (await this.ibexService.getBtcExchangeRate()).rate;
    const lastHistoricRate = (
      await this.historicRateRepository.find({
        order: { id: 'DESC' },
        take: 1,
      })
    )[0];
    let transactionGroup: TransactionGroup;
    const coin = await this.coinRepository.findOneBy({acronym: CoinEnum.SATS})
    await this.transactionRepository.manager.transaction('SERIALIZABLE',async entityManager => {
      const btcWallet = await findAndLockWallet({
        entityManager: entityManager,
        coinId: coin.id,
        userId: user.id
      })
      await entityManager.update(Wallet, btcWallet.id, {
        availableBalance: new Decimal(btcWallet.availableBalance).plus(amount).toNumber(),
        balance: new Decimal(btcWallet.balance).plus(amount).toNumber(),
      });

      transactionGroup = entityManager.create(TransactionGroup, {
        status: Status.COMPLETED,
        transactionCoin: coin,
        toUser: user,
        btcPrice: btcPrice,
        historicRate: lastHistoricRate,
        type: TransactionType.RECEPTION,
      });
      await entityManager.insert(TransactionGroup, transactionGroup);

      const transaction = entityManager.create(Transaction, {
        amount: amount,
        balance: btcWallet.availableBalance,
        wallet: btcWallet,
        subtype: TransactionSubtype.CREDIT_BTC_TRANSFER_LN,
        transactionGroup: transactionGroup,
      });

      await entityManager.insert(Transaction, [transaction]);
      const transactionDetail = entityManager.create(TransactionDetail, {
        transaction: transaction,
        ibexTransactionId: data.transaction.id,
        metadata: data.transaction,
      });

      await entityManager.insert(TransactionDetail, [transactionDetail]);

    });
    this.pushNotificationService.sendPushToUser(user, {
      message: `Recibiste ${amount} SATS`,
      title: 'Recibiste',
      data: {
        route: MobileRoutePaths.Transactions,
        currency: CoinEnum.SATS,
        amount: amount.toString()
      }
    });
    return transactionGroup;
  }
}
