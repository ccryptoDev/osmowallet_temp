import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { EntityManager, Repository } from 'typeorm';
import { IbexService } from '../ibex/ibex.service';
import { SendFiatContext } from './send_fiat/sendFiatContext';
import { SendFiatDto } from './dtos/sendFiat.dto';
import { EstimateBtcSendDto } from './dtos/estimate.dto';
import { SendDto } from './dtos/send.dto';
import { Coin } from 'src/entities/coin.entity';
import { CoinEnum } from '../me/enums/coin.enum';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { SmsSendFiat } from './send_fiat/strategies/smsSendFiat.strategy';
import { NormalSendFiat } from './send_fiat/strategies/normalSendFiat.strategy';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { AuthUser } from '../auth/payloads/auth.payload';
import { OsmoBusinessBpt } from 'src/entities/osmoBusinessBPT.entity';
import { CreateTransaction } from './dtos/transaction.dto';
import { Feature } from 'src/entities/feature.entity';
import { SmsService } from '../../services/sms/sms.service';
import { RedisService } from 'src/common/services/redis/redis.service';
import { Address } from 'src/entities/address.entity';
import * as ln from 'lnurl';
import * as lightningPayReq from 'bolt11';
import { FeaturesService } from '../features/features.service';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import Decimal from 'decimal.js';
import { RefundSendDto } from './dtos/refund.dto';
import { Status } from 'src/common/enums/status.enum';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { SendBtc, SendContext } from './btc/send.btc';
import { SendFactory } from './btc/send.factory';
import { SendBtcData } from './btc/send.data';
import { isUUID } from 'class-validator';
import { GenerateInvoiceFromEmail } from './dtos/generateInvoice.dto';
import axios, { isAxiosError } from 'axios';
import { PushNotificationService } from '../push-notification/push-notification.service';
import { TransactionsService } from '../transactions/transactions.service';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { CoinsService } from '../coins/coins.service';
import { TransactionType } from 'src/common/enums/transactionsType.enum';

@Injectable()
export class SendService {
  private refundUrl = `https://${process.env.DOMAIN}/send/transactions/refund`;
  private refundQueue = `SEND-BTC-REFUND-${process.env.ENV}`;
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(IbexAccount) private ibexAccountRepository: Repository<IbexAccount>,
    @InjectRepository(Coin) private coinRepository: Repository<Coin>,
    @InjectRepository(OsmoBusinessBpt) private osmoBusinessBpt: Repository<OsmoBusinessBpt>,
    @InjectRepository(TransactionGroup) private transactionGroupRepository: Repository<TransactionGroup>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @InjectRepository(HistoricRate) private historicRateRepository: Repository<HistoricRate>,
    @InjectRepository(Feature) private featureRepository: Repository<Feature>,
    private manager: EntityManager,
    private ibexService: IbexService,
    private pushNotificationService: PushNotificationService,
    private smsService: SmsService,
    private googleCloudTasksService: GoogleCloudTasksService,
    private redisService: RedisService,
    private featureService: FeaturesService,
    private encryptedHelper: EncrypterHelper,
    private transactionService: TransactionsService,
    private coinService: CoinsService
  ) {}


  async generateInvoiceFromEmail(body: GenerateInvoiceFromEmail) {
    try{
      const email = body.email
      const username = email.split('@')[0]
      const domain = email.split('@')[1]
      const url = `https://${domain}/.well-known/lnurlp/${username}`
      const response = await axios({
        url: url,
        method: 'GET'
      })
      const urlCallback = response.data.callback
      const amountString = urlCallback.includes('?') ? `&` : `?`
      const sats = body.amount * 1000
      const invoiceResponse = await axios({
        method: 'GET',
        url: `${urlCallback}${amountString}amount=${sats}`
      })
      return {
        bolt11: invoiceResponse.data
      }
    }catch(error){
      if(isAxiosError(error)){
        if(error.response.status == 404){
          throw new BadRequestException('Address not found')
        }
      }
      throw new BadRequestException('A problem has occurred')
    }
  }

  async sendV2(authUser: AuthUser, data: SendDto) {
    //await this.transactionService.checkTransactionRateLimit(authUser.sub,TransactionType.SEND)
    if(data.address.toLowerCase().startsWith('lnbc') || data.address.toLowerCase().startsWith('lnurl')){
      data.address = data.address.toLocaleLowerCase()
    }
    const sendMethod: SendBtc = SendFactory.getSendType(data, this.userRepository.manager, this.ibexService,this.coinService, this.featureService,this.googleCloudTasksService)
    const coin = await this.coinRepository.findOneBy({ id: data.coinId });
    if (!coin) throw new BadRequestException('Invalid coinId');
    const context = new SendContext(sendMethod)
    const sendData: SendBtcData = {authUser: authUser, payload: data}
    if (coin.acronym == CoinEnum.SATS){
      return await context.sendNative(sendData)
    }
    return await context.sendAutoconvert(sendData)
  }

  async createTransactionsV2(data: CreateTransaction) {
    const sendMethod: SendBtc = SendFactory.getSendType(data.payload, this.userRepository.manager, this.ibexService,this.coinService, this.featureService,this.googleCloudTasksService)
    const coin = await this.coinRepository.findOneBy({ id: data.payload.coinId });
    if (!coin) throw new BadRequestException('Invalid coinId');
    const context = new SendContext(sendMethod)
    if (coin.acronym == CoinEnum.SATS){
      return await context.createNativeTransactions(data)
    }
    return await context.createAutoconvertTransactions(data)
  }

  async addRefundTransactonToQueue(data: RefundSendDto) {
    this.googleCloudTasksService.createInternalTask(
      this.refundQueue,
      data,
      this.refundUrl,
    );
  }

  async refundTransaction(data: RefundSendDto) {
    const coin = await this.coinRepository.findOneBy({id: data.createSendTransaction.payload.coinId,});
    if (coin.acronym == CoinEnum.SATS) {
      return this.refundNativeInvoiceTransaction(data, coin);
    } else {
      return this.refundAutoConverToSendInvoiceTransaction(data, coin);
    }
  }

  async refundNativeInvoiceTransaction(data: RefundSendDto, coin: Coin) {
    await this.coinRepository.manager.transaction('SERIALIZABLE', async entityManager => {
      const userMainWallet = await findAndLockWallet({entityManager: entityManager, coinId: coin.id, userId: data.createSendTransaction.user.sub})
      userMainWallet.availableBalance = new Decimal(userMainWallet.availableBalance).plus(data.createSendTransaction.amounts.totalUserBtcToDebit).toNumber();
      userMainWallet.balance = new Decimal(userMainWallet.balance).plus(data.createSendTransaction.amounts.totalUserBtcToDebit).toNumber();
      await entityManager.save(Wallet, userMainWallet)
      if(isUUID(data.transactionGroupId)){
        await entityManager.update(TransactionGroup,data.transactionGroupId, {
          status: Status.FAILED
        })
      }
      
    });
    const user = await this.userRepository.findOneBy({ id: data.createSendTransaction.user.sub });
      this.pushNotificationService.sendPushToUser(user, {
        title: 'Transaction Failed',
        message: 'Your transaction could not be completed',
      });
  }

  async refundAutoConverToSendInvoiceTransaction(data: RefundSendDto, coin: Coin) {
    const ibexAccount = await this.ibexAccountRepository.findOneBy({user: { id: data.createSendTransaction.user.sub },});
      if(data.refundToOsmo){
        const satsToRefund = new Decimal(data.createSendTransaction.payload.amount).plus(data.createSendTransaction.payload.feeSat).toNumber();
        await this.refundFromToOsmo(ibexAccount, satsToRefund);
      }
      await this.coinRepository.manager.transaction('SERIALIZABLE',async entityManager => {
        const [ osmoFeeWallet, userMainWallet] = await Promise.all([
          findAndLockWallet({entityManager: entityManager, coinId: coin.id, alias: MainWalletsAccount.FEES}),
          findAndLockWallet({entityManager: entityManager, coinId: coin.id, userId: data.createSendTransaction.user.sub})
        ])
        osmoFeeWallet.availableBalance = new Decimal(osmoFeeWallet.availableBalance).minus(data.createSendTransaction.amounts.osmoFiatFeeToCredit).toNumber();
        osmoFeeWallet.balance = new Decimal(osmoFeeWallet.balance).minus(data.createSendTransaction.amounts.osmoFiatFeeToCredit).toNumber();

        userMainWallet.availableBalance = new Decimal(userMainWallet.availableBalance).plus(data.createSendTransaction.amounts.totalUserFiatToDebit).toNumber();
        userMainWallet.balance = new Decimal(userMainWallet.balance).plus(data.createSendTransaction.amounts.totalUserFiatToDebit).toNumber();
        await entityManager.save([osmoFeeWallet, userMainWallet])
        if(isUUID(data.transactionGroupId)){
          await entityManager.update(TransactionGroup,data.transactionGroupId,{status: Status.FAILED})
        }
        
      });
      const user = await this.userRepository.findOneBy({ id: data.createSendTransaction.user.sub });
      this.pushNotificationService.sendPushToUser(user, {
        title: 'Transaction Failed',
        message: 'Your transaction could not be completed',
      });
  }

  //Fast refund to osmo
  async refundFromToOsmo(ibexAccount: IbexAccount, amount: number) {
    const lnURLDecode = ln.decode(process.env.IBEX_OSMO_LNURL_ADDRESS_PAYER);
    const params = await this.ibexService.getParams(lnURLDecode);
    await this.ibexService.payLnURL(params, amount * 1000, ibexAccount.account);
  }

  async estimateSend(data: EstimateBtcSendDto) {
    if (data.address.startsWith('lnurl') || data.address.startsWith('LNURL')) throw new BadRequestException('address no válido');

    const isLnInvoice = data.address.toLowerCase().startsWith('lnbc');
    let feeSats = 0;
    let osmoBusiness = null;
    let invoice
    let memoDecrypted
    if (isLnInvoice) {
      const lnDecoded = lightningPayReq.decode(data.address);
      
      let amountSats = lnDecoded.satoshis;
      if (amountSats == null && data.amountSats <= 0) {
        throw new BadRequestException('amount debe ser mayor que 0');
      } else {
        amountSats = data.amountSats;
      }
      invoice = await this.ibexService.getInvoiceFromBolt11(data.address.toLowerCase());
      if (invoice) {
        const bpt = await this.osmoBusinessBpt.findOneBy({bptName: invoice.memo,});
        memoDecrypted = await this.encryptedHelper.decryptPayload(invoice.memo)
        .then(r => r)
        .catch(e => console.error(e))
        if (bpt) osmoBusiness = bpt;
      }
      feeSats = await this.ibexService.estimateInvoiceAddress(data.address.toLowerCase(),amountSats);
    } else {
      if (data.amountSats <= 0) throw new BadRequestException('El monto debe ser mayor que 0');
      feeSats = await this.ibexService.estimateOnChainAddress(data.address,data.amountSats);
    }
    return {
      fee: feeSats,
      osmoBusiness: osmoBusiness,
      memo: memoDecrypted
    };
  }


  async sendFiat(authUser: AuthUser, data: SendFiatDto) {
    if (data.mobile != null && data.receiverId != null) throw new BadRequestException('receiverId y mobile no pueden ir juntos');
    const manager = this.addressRepository.manager
    let strategy;
    if (data.mobile != null && data.receiverId == null) {
      strategy = new SmsSendFiat(
        manager,
        authUser.sub,
        data,
        this.smsService,
      );
    } else {
      strategy = new NormalSendFiat(
        manager,
        authUser.sub,
        data,
        this.pushNotificationService,
        this.googleCloudTasksService
      );
    }
    const fiatContext = new SendFiatContext(strategy);

    return await fiatContext.executeSend();
  }
}
