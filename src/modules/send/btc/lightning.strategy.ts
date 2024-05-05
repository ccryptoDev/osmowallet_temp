import { EntityManager } from "typeorm";
import { Send, SendBtc } from "./send.btc";
import { SendBtcData } from "./send.data";
import * as lightningPayReq from 'bolt11';
import { CoinEnum } from "src/modules/me/enums/coin.enum";
import { Wallet } from "src/entities/wallet.entity";
import Decimal from "decimal.js";
import { BadRequestException } from "@nestjs/common";
import { CreateTransaction } from "../dtos/transaction.dto";
import { v4 as uuidv4 } from 'uuid';
import { TransactionGroup } from "src/entities/transactionGroup.entity";
import { OsmoBusinessBpt } from "src/entities/osmoBusinessBPT.entity";
import { Status } from "src/common/enums/status.enum";
import { TransactionType } from "src/common/enums/transactionsType.enum";
import { IbexService } from "src/modules/ibex/ibex.service";
import { TransactionDetail } from "src/entities/transaction.detail.entity";
import { TransactionFee } from "src/entities/transactionFee.entity";
import { Transaction } from "src/entities/transaction.entity";
import { Feature } from "src/entities/feature.entity";
import { FeatureEnum } from "src/common/enums/feature.enum";
import { FeaturesService } from "src/modules/features/features.service";
import { Coin } from "src/entities/coin.entity";
import { IbexServiceException } from "src/common/exceptions/ibex.exception";
import { Partner } from "src/common/enums/partner.enum";
import { GoogleCloudTasksService } from "src/services/google-cloud-tasks/google-cloud-tasks.service";
import { PayLnURLErrorInBuyIfEmpty } from "../exceptions/send.exception";
import { TransactionSubtype } from "src/common/enums/transactionSubtype.enum";
import { findAndLockWallet } from "src/common/utils/find-and-lock-wallet";
import { MainWalletsAccount } from "src/common/enums/main-wallets.enum";
import { Setting } from "src/entities/setting.entity";
import { CoinsService } from "src/modules/coins/coins.service";
import { FeeSource } from "src/common/enums/fee-source.enum";


export class Lightning extends Send implements SendBtc {
    
        constructor(
          ibexService: IbexService,
          googleCloudTasksService: GoogleCloudTasksService,
          manager: EntityManager,
          private coinService: CoinsService,
          private featureService: FeaturesService
      ) {
          super(ibexService, googleCloudTasksService, manager);
      }


    private async isOsmoBussiness(data: SendBtcData) {
        const invoice = await this.ibexService.getInvoiceFromBolt11(data.payload.address);
        if(invoice){
            const bpt = await this.manager.findOneBy(OsmoBusinessBpt,{bptName: invoice.memo,});
            if(bpt) return true
        }
        return false
    }

    private validateInvoiceExpiration(data: SendBtcData) : number{
        const lnDecoded = lightningPayReq.decode(data.payload.address);
        let amountSats = data.payload.amount;
        if (lnDecoded.satoshis !== null) {
            amountSats = lnDecoded.satoshis;
        }
        const invoiceExpireDate = new Date(lnDecoded.timeExpireDate * 1000);
        const currentTimeStamp = new Date();
        if (invoiceExpireDate < currentTimeStamp) throw new BadRequestException('Invoice Expired');
        return amountSats
    }

    async sendNative(data: SendBtcData): Promise<any> {
        const amountSats = this.validateInvoiceExpiration(data)
        let userBtcWallet: Wallet
        await this.manager.transaction('SERIALIZABLE',async entityManager => {
            userBtcWallet = await findAndLockWallet({entityManager: entityManager, coinId: data.payload.coinId, userId: data.authUser.sub})
            const totalAmount = new Decimal(amountSats).plus(data.payload.feeSat).toNumber();
            if (userBtcWallet.availableBalance < totalAmount) throw new BadRequestException('Insufficient balance');
            await entityManager.update(Wallet, userBtcWallet.id, {
                availableBalance: new Decimal(userBtcWallet.availableBalance).minus(amountSats).toNumber(),
                balance: new Decimal(userBtcWallet.balance).minus(amountSats).toNumber(),
            });
        });
        const body: CreateTransaction = {
            id: uuidv4(),
            user: {
              sub: data.authUser.sub,
            },
            amounts: {
              totalUserBtcToDebit: amountSats,
            },
            balances: {
              userSatsBalance: userBtcWallet.availableBalance,
            },
            payload: data.payload,
            wallets: {
              userSatsWallet: userBtcWallet.id,
            },
        };
        this.createNativeTransactions(body)
    }

    async sendAutoconvert(data: SendBtcData): Promise<void> {
        const SATOSHI_TO_BITCOIN_RATIO = Math.pow(10, -8);
        const MAX_USD_FEE_AMOUNT = 50;
        const amountSats = this.validateInvoiceExpiration(data)
        const [isOsmoBussiness, coin] = await Promise.all([
            this.isOsmoBussiness(data),
            this.manager.findOneBy(Coin,{id: data.payload.coinId})
        ])
        let buyFee = 0;
        let lowerLimit = 0
        let upperLimit = 0
        let feature: Feature
        if (!isOsmoBussiness) {
          feature = await this.manager.findOneBy(Feature, { name: FeatureEnum.AUTOCONVERT_TO_SEND });
          const tierFeature = await this.featureService.getTierFeature(feature.id, data.authUser)
          lowerLimit = tierFeature.min
          upperLimit = tierFeature.max
          buyFee = tierFeature.fee;
        } else if (data.payload.partner != null && data.payload.partner != Partner.BITREFILL) {
          feature = await this.manager.findOneBy(Feature,{name: FeatureEnum.SEND_GLOBALLY});
          const tierFeature = await this.featureService.getTierFeature(feature.id, data.authUser)
          lowerLimit = tierFeature.min
          upperLimit = tierFeature.max
          buyFee = tierFeature.fee;
        }else{
          lowerLimit = 0
          upperLimit = 0
          buyFee = 0;
        }
       
        let btcPrice = new Decimal(data.payload.btcPrice);
        
        btcPrice = new Decimal(btcPrice.times(coin.exchangeRate).toFixed(2));
        const inflatedSats = new Decimal(amountSats).plus(data.payload.feeSat);
        let osmoFiatFeeToCredit = new Decimal(0);
        let totalFiatToDebit = new Decimal(0);
        const fiats = new Decimal(inflatedSats).times(SATOSHI_TO_BITCOIN_RATIO).times(btcPrice).toFixed(2);
        osmoFiatFeeToCredit = new Decimal(new Decimal(inflatedSats).times(SATOSHI_TO_BITCOIN_RATIO).times(buyFee).times(btcPrice).toFixed(2));
        if(data.payload.partner != null){
            const usdOsmoFiatFeeToCredit = osmoFiatFeeToCredit.dividedBy(coin.exchangeRate);
            if(usdOsmoFiatFeeToCredit.greaterThan(new Decimal(MAX_USD_FEE_AMOUNT))) {
                const usdFeeAmount = new Decimal(MAX_USD_FEE_AMOUNT);
                osmoFiatFeeToCredit = new Decimal(usdFeeAmount).times(coin.exchangeRate);
            }
        }
        totalFiatToDebit = new Decimal(new Decimal(fiats).plus(osmoFiatFeeToCredit).toFixed(2));
        if(data.payload.partner != null){
            if(totalFiatToDebit.toNumber() < lowerLimit  || totalFiatToDebit.toNumber() >= upperLimit) throw new BadRequestException('Amount out of limit range')
        }
        const satCoin = await this.manager.findOneBy(Coin,{acronym: CoinEnum.SATS})
        let userFiatWallet: Wallet, osmoFeeWallet: Wallet, userBtcWallet: Wallet
        await this.manager.transaction('SERIALIZABLE',async entityManager => {
            [userFiatWallet, osmoFeeWallet, userBtcWallet] = await Promise.all([
              findAndLockWallet({entityManager: entityManager, coinId: data.payload.coinId,userId: data.authUser.sub}),
              findAndLockWallet({entityManager: entityManager, coinId: data.payload.coinId, alias: MainWalletsAccount.FEES}),
              findAndLockWallet({entityManager: entityManager, coinId: satCoin.id,userId: data.authUser.sub}),
            ])
            /// EL amount que viene es en SATS
            if (new Decimal(userFiatWallet.availableBalance).lessThan(totalFiatToDebit)) throw new BadRequestException('Insufficient balance');
            await Promise.all([
              entityManager.update(Wallet, userFiatWallet.id, {
                availableBalance: new Decimal(userFiatWallet.availableBalance).minus(totalFiatToDebit).toNumber(),
                balance: new Decimal(userFiatWallet.balance).minus(totalFiatToDebit).toNumber(),
              }),
              entityManager.update(Wallet, osmoFeeWallet.id, {
                availableBalance: new Decimal(osmoFeeWallet.availableBalance).plus(osmoFiatFeeToCredit).toNumber(),
                balance: new Decimal(osmoFeeWallet.balance).plus(osmoFiatFeeToCredit).toNumber(),
              })
            ]);
            
          });
        const body: CreateTransaction = {
            id: uuidv4(),
            user: data.authUser,
            balances: {
                osmoWalletFeeBalance: osmoFeeWallet.availableBalance,
                userFiatBalance: userFiatWallet.availableBalance,
                userSatsBalance: userBtcWallet.availableBalance,
            },
            btcPrice: data.payload.btcPrice,
            payload: data.payload,
            amounts: {
                osmoFiatFeeToCredit: osmoFiatFeeToCredit.toNumber(),
                totalUserFiatToDebit: totalFiatToDebit.toNumber(),
                totalUserBtcToDebit: amountSats,
            },
            wallets: {
                osmoFeeWallet: osmoFeeWallet.id,
                userFiatWallet: userFiatWallet.id,
                userSatsWallet: userBtcWallet.id,
            },
        };
        this.createAutoconvertTransactions(body)
    }

    async createNativeTransactions(data: CreateTransaction): Promise<void> {
      let transactionGroup: TransactionGroup 
      try{
          const btcPrice = data.payload.btcPrice
          const startTime = Date.now();
          
         
          let osmoBusiness: OsmoBusinessBpt = null;
          const invoice = await this.ibexService.getInvoiceFromBolt11(data.payload.address);
          const queryDuration = Date.now() - startTime;
          console.log(`Query for getInvoiceFromBolt11 took ${queryDuration}ms`);
          if (invoice) {  
              osmoBusiness = await this.manager.findOneBy(OsmoBusinessBpt,{bptName: invoice.memo,});
          }
          const [ibexAccountId, lastHistoricRateId] = await Promise.all([
            this.ibexService.getIbexAccountIdByUserId(data.user.sub),
            this.coinService.getLastHistoricRateId()
          ])
          const transactionStartTime = Date.now()
          await this.manager.transaction(async entityManager => {
              transactionGroup = entityManager.create(TransactionGroup,{
                  fromUser: {id: data.user.sub},
                  status: Status.COMPLETED,
                  type: TransactionType.SEND,
                  historicRate: {id: lastHistoricRateId},
                  transactionCoin: {id: data.payload.coinId},
                  partner: data.payload.partner,
                  btcPrice: btcPrice,
                  osmoBusiness: osmoBusiness,
                  category: {id: data.payload.categoryId},
                  note: data.payload.note
              });
              await entityManager.insert(TransactionGroup, transactionGroup);
              const transaction = entityManager.create(Transaction, {
                  amount: data.amounts.totalUserBtcToDebit,
                  wallet: {id: data.wallets.userSatsWallet},
                  balance: data.balances.userSatsBalance,
                  subtype: TransactionSubtype.DEBIT_BTC_TRANSFER_LN,
                  transactionGroup: transactionGroup,
              });
              await entityManager.insert(Transaction, transaction);
              const transactionDetail = entityManager.create(TransactionDetail, {
                  transaction: transaction,
                  address: data.payload.address
              });
              await entityManager.insert(TransactionDetail, transactionDetail);
              const networkFee = entityManager.create(TransactionFee, {
                amount: data.payload.feeSat,
                coin: {id: data.payload.coinId},
                transactionGroup: transactionGroup,
                source: FeeSource.NETWORK
              });
              await entityManager.insert(TransactionFee,networkFee)
          });

          const transactionDuration = Date.now() - transactionStartTime;
          console.log(`Transaction took ${transactionDuration}ms`);
          const startInvoiceTime = Date.now()
          await this.ibexService.payInvoice(
            data.payload.address,
            ibexAccountId,
            data.payload.amount * 1000,
            transactionGroup.id,
          )
          const totalInvoiceTime = Date.now() - startInvoiceTime
          console.log(`Invoice took ${totalInvoiceTime}ms`);
          const totalDuration = Date.now() - startTime;
          console.log(`Total took ${totalDuration}ms`);
      }catch(error){
        console.log(error)
        if(error instanceof IbexServiceException){
          this.addToRefundQueue({createSendTransaction: data, transactionGroupId: transactionGroup.id, refundToOsmo: false})
        }
      }
    }

    async createAutoconvertTransactions(data: CreateTransaction) : Promise<void>{
        let transactionGroup: TransactionGroup
        try{
          const fastBuyStartTime = Date.now();
          //await this.doFastBuy(data);
          const fastBuyDuration = Date.now() - fastBuyStartTime;
          console.log(`Fast buy took ${fastBuyDuration}ms`);
          const [btcCoin, lastHistoricRateId ] = await Promise.all([
            this.manager.findOneBy(Coin, {acronym: CoinEnum.SATS}),
            this.coinService.getLastHistoricRateId()
          ]);
          const invoiceStartTime = Date.now();
          const invoice = await this.ibexService.getInvoiceFromBolt11(data.payload.address.toLocaleLowerCase());
          const invoiceDuration = Date.now() - invoiceStartTime;
          console.log(`Fetching invoice took ${invoiceDuration}ms`);
          let osmoBusiness: OsmoBusinessBpt = null;
          if (invoice) {
            osmoBusiness = await this.manager.findOneBy(OsmoBusinessBpt,{bptName: invoice.memo,});
          }
          const transactionStart = Date.now();
          await this.manager.transaction(async entityManager => {
            transactionGroup = entityManager.create(TransactionGroup, {
              fromUser: {id: data.user.sub},
              status: Status.COMPLETED,
              transactionCoin: {id: data.payload.coinId},
              type: TransactionType.SEND,
              btcPrice: data.btcPrice,
              historicRate: {id: lastHistoricRateId},
              partner: data.payload.partner,
              osmoBusiness: osmoBusiness,
              category: {id: data.payload.categoryId},
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
            await entityManager.insert(Transaction, [
              osmoFeeTransaction,
              userFiatTransaction,
              userSatsTransaction,
            ]);
            const networkFee = entityManager.create(TransactionFee, {
              amount: data.payload.feeSat,
              coin: {id: btcCoin.id},
              transactionGroup: transactionGroup,
              source: FeeSource.NETWORK
            });
            const osmoFee = entityManager.create(TransactionFee, {
              amount: data.amounts.osmoFiatFeeToCredit,
              coin: {id: data.payload.coinId},
              transactionGroup: transactionGroup,
            });
            const transactionDetail = entityManager.create(TransactionDetail, {
              transaction: userSatsTransaction,
              address: data.payload.address
            });
            await Promise.all([
              entityManager.insert(TransactionDetail, transactionDetail),
              entityManager.insert(TransactionFee, [osmoFee,networkFee])
            ])
          });
          const transactionEnd = Date.now();
          const transactionDuration = transactionEnd - transactionStart;
          console.log(`Transaction processing took ${transactionDuration}ms`);
          const paymentStartTime = Date.now();
          await this.ibexService.payInvoice(
            data.payload.address,
            process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID,
            data.payload.amount * 1000,
            transactionGroup.id,
          )
          const paymentEndTime = Date.now();
          console.log(`Payment processing took ${paymentEndTime - paymentStartTime}ms`);
        }catch(error){
          if(error instanceof PayLnURLErrorInBuyIfEmpty || error instanceof IbexServiceException){
            this.addToRefundQueue({createSendTransaction: data, transactionGroupId: transactionGroup.id, refundToOsmo: false})
          }
        }
    }





    
}