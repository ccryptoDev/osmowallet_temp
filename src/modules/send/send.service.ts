import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { isAxiosError } from 'axios';
import * as lightningPayReq from 'bolt11';
import { isUUID } from 'class-validator';
import Decimal from 'decimal.js';
import * as ln from 'lnurl';
import { MainWalletsAccount } from 'src/common/enums/main-wallets.enum';
import { Status } from 'src/common/enums/status.enum';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { RedisService } from 'src/common/services/redis/redis.service';
import { findAndLockWallet } from 'src/common/utils/find-and-lock-wallet';
import { Address } from 'src/entities/address.entity';
import { Coin } from 'src/entities/coin.entity';
import { Feature } from 'src/entities/feature.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { OsmoBusinessBpt } from 'src/entities/osmoBusinessBPT.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { EntityManager, Repository } from 'typeorm';
import { SmsService } from '../../services/sms/sms.service';
import { AuthUser } from '../auth/payloads/auth.payload';
import { CoinsService } from '../coins/coins.service';
import { FeaturesService } from '../features/features.service';
import { IbexService } from '../ibex/ibex.service';
import { CoinEnum } from '../me/enums/coin.enum';
import { PushNotificationService } from '../push-notification/push-notification.service';
import { TransactionsService } from '../transactions/transactions.service';
import { SendBtc, SendContext } from './btc/send.btc';
import { SendBtcData } from './btc/send.data';
import { SendFactory } from './btc/send.factory';
import { EstimateBtcSendDto } from './dtos/estimate.dto';
import { GenerateInvoiceFromEmail } from './dtos/generateInvoice.dto';
import { RefundSendDto } from './dtos/refund.dto';
import { SendDto } from './dtos/send.dto';
import { SendFiatDto } from './dtos/sendFiat.dto';
import { CreateTransaction } from './dtos/transaction.dto';
import { SendFiatContext } from './send_fiat/sendFiatContext';
import { NormalSendFiat } from './send_fiat/strategies/normalSendFiat.strategy';
import { SmsSendFiat } from './send_fiat/strategies/smsSendFiat.strategy';

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
        private coinService: CoinsService,
    ) {}

    async generateInvoiceFromEmail(body: GenerateInvoiceFromEmail) {
        try {
            const email = body.email;
            const username = email.split('@')[0];
            const domain = email.split('@')[1];
            const url = `https://${domain}/.well-known/lnurlp/${username}`;
            const response = await axios({
                url: url,
                method: 'GET',
            });
            const urlCallback = response.data.callback;
            const amountString = urlCallback.includes('?') ? `&` : `?`;
            const sats = body.amount * 1000;
            const invoiceResponse = await axios({
                method: 'GET',
                url: `${urlCallback}${amountString}amount=${sats}`,
            });
            return {
                bolt11: invoiceResponse.data,
            };
        } catch (error) {
            if (isAxiosError(error)) {
                if (!error.response) throw new BadRequestException('A problem has occurred');
                if (error.response.status == 404) {
                    throw new BadRequestException('Address not found');
                }
            }
            throw new BadRequestException('A problem has occurred');
        }
    }

    async sendV2(user: AuthUser, data: SendDto) {
        //await this.transactionService.checkTransactionRateLimit(authUser.sub,TransactionType.SEND)
        if (data.address.toLowerCase().startsWith('lnbc') || data.address.toLowerCase().startsWith('lnurl')) {
            data.address = data.address.toLocaleLowerCase();
        }
        const sendMethod: SendBtc = SendFactory.getSendType(
            data,
            this.userRepository.manager,
            this.ibexService,
            this.coinService,
            this.featureService,
            this.googleCloudTasksService,
        );
        const coin = await this.coinRepository.findOneBy({ id: data.coinId });
        if (!coin) throw new BadRequestException('Invalid coinId');
        const context = new SendContext(sendMethod);
        const sendData: SendBtcData = { authUser: user, payload: data };
        if (coin.acronym == CoinEnum.SATS) {
            return await context.sendNative(sendData);
        }
        return await context.sendAutoconvert(sendData);
    }

    async createTransactionsV2(data: CreateTransaction) {
        const sendMethod: SendBtc = SendFactory.getSendType(
            data.payload,
            this.userRepository.manager,
            this.ibexService,
            this.coinService,
            this.featureService,
            this.googleCloudTasksService,
        );
        const coin = await this.coinRepository.findOneBy({ id: data.payload.coinId });
        if (!coin) throw new BadRequestException('Invalid coinId');
        const context = new SendContext(sendMethod);
        if (coin.acronym == CoinEnum.SATS) {
            return await context.createNativeTransactions(data);
        }
        return await context.createAutoconvertTransactions(data);
    }

    async addRefundTransactonToQueue(data: RefundSendDto) {
        this.googleCloudTasksService.createInternalTask(this.refundQueue, data, this.refundUrl);
    }

    async refundTransaction(data: RefundSendDto) {
        const coin = await this.coinRepository.findOneBy({ id: data.createSendTransaction.payload.coinId });
        if (!coin) throw new BadRequestException('Invalid coinId');
        if (coin.acronym == CoinEnum.SATS) {
            return this.refundNativeInvoiceTransaction(data, coin);
        } else {
            return this.refundAutoConverToSendInvoiceTransaction(data, coin);
        }
    }

    async refundNativeInvoiceTransaction(data: RefundSendDto, coin: Coin) {
        await this.coinRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const userMainWallet = await findAndLockWallet({
                entityManager: entityManager,
                coinId: coin.id,
                userId: data.createSendTransaction.user.sub,
            });
            if (!userMainWallet) throw new BadRequestException('Wallet not found');
            if (!data.createSendTransaction.amounts.totalUserBtcToDebit) throw new BadRequestException('Amount not found');

            userMainWallet.availableBalance = new Decimal(userMainWallet.availableBalance)
                .plus(data.createSendTransaction.amounts.totalUserBtcToDebit)
                .toNumber();
            userMainWallet.balance = new Decimal(userMainWallet.balance)
                .plus(data.createSendTransaction.amounts.totalUserBtcToDebit)
                .toNumber();
            await entityManager.save(Wallet, userMainWallet);
            if (isUUID(data.transactionGroupId)) {
                await entityManager.update(TransactionGroup, data.transactionGroupId, {
                    status: Status.FAILED,
                });
            }
        });
        const user = await this.userRepository.findOneBy({ id: data.createSendTransaction.user.sub });
        if (!user) throw new BadRequestException('User not found');

        this.pushNotificationService.sendPushToUser(user, {
            title: 'Transaction Failed',
            message: 'Your transaction could not be completed',
        });
    }

    async refundAutoConverToSendInvoiceTransaction(data: RefundSendDto, coin: Coin) {
        const ibexAccount = await this.ibexAccountRepository.findOneBy({ user: { id: data.createSendTransaction.user.sub } });
        if (!ibexAccount) throw new BadRequestException('Ibex account not found');

        if (data.refundToOsmo) {
            const satsToRefund = new Decimal(data.createSendTransaction.payload.amount)
                .plus(data.createSendTransaction.payload.feeSat)
                .toNumber();
            await this.refundFromToOsmo(ibexAccount, satsToRefund);
        }
        await this.coinRepository.manager.transaction('SERIALIZABLE', async (entityManager) => {
            const [osmoFeeWallet, userMainWallet] = await Promise.all([
                findAndLockWallet({ entityManager: entityManager, coinId: coin.id, alias: MainWalletsAccount.FEES }),
                findAndLockWallet({ entityManager: entityManager, coinId: coin.id, userId: data.createSendTransaction.user.sub }),
            ]);
            if (!osmoFeeWallet || !userMainWallet) throw new BadRequestException('Wallet not found');
            if (!data.createSendTransaction.amounts.osmoFiatFeeToCredit || !data.createSendTransaction.amounts.totalUserFiatToDebit)
                throw new BadRequestException('Amount not found');

            osmoFeeWallet.availableBalance = new Decimal(osmoFeeWallet.availableBalance)
                .minus(data.createSendTransaction.amounts.osmoFiatFeeToCredit)
                .toNumber();
            osmoFeeWallet.balance = new Decimal(osmoFeeWallet.balance)
                .minus(data.createSendTransaction.amounts.osmoFiatFeeToCredit)
                .toNumber();

            userMainWallet.availableBalance = new Decimal(userMainWallet.availableBalance)
                .plus(data.createSendTransaction.amounts.totalUserFiatToDebit)
                .toNumber();
            userMainWallet.balance = new Decimal(userMainWallet.balance)
                .plus(data.createSendTransaction.amounts.totalUserFiatToDebit)
                .toNumber();
            await entityManager.save([osmoFeeWallet, userMainWallet]);
            if (isUUID(data.transactionGroupId)) {
                await entityManager.update(TransactionGroup, data.transactionGroupId, { status: Status.FAILED });
            }
        });
        const user = await this.userRepository.findOneBy({ id: data.createSendTransaction.user.sub });
        if (!user) throw new BadRequestException('User not found');

        this.pushNotificationService.sendPushToUser(user, {
            title: 'Transaction Failed',
            message: 'Your transaction could not be completed',
        });
    }

    //Fast refund to osmo
    async refundFromToOsmo(ibexAccount: IbexAccount, amount: number) {
        const lnURLDecode = ln.decode(process.env.IBEX_OSMO_LNURL_ADDRESS_PAYER ?? '');
        const params = await this.ibexService.getParams(lnURLDecode);
        await this.ibexService.payLnURL(params, amount * 1000, ibexAccount.account);
    }

    async estimateSend(data: EstimateBtcSendDto) {
        if (data.address.startsWith('lnurl') || data.address.startsWith('LNURL')) throw new BadRequestException('address no válido');

        const isLnInvoice = data.address.toLowerCase().startsWith('lnbc');
        let feeSats = 0;
        let osmoBusiness = null;
        let invoice;
        let memoDecrypted;
        if (isLnInvoice) {
            const lnDecoded = lightningPayReq.decode(data.address);

            let amountSats = lnDecoded.satoshis;
            if (amountSats === undefined && data.amountSats && data.amountSats <= 0)
                throw new BadRequestException('amount debe ser mayor que 0');

            amountSats = data.amountSats;

            invoice = await this.ibexService.getInvoiceFromBolt11(data.address.toLowerCase());
            if (invoice) {
                const bpt = await this.osmoBusinessBpt.findOneBy({ bptName: invoice.memo });
                memoDecrypted = await this.encryptedHelper
                    .decryptPayload(invoice.memo)
                    .then((r) => r)
                    .catch((e) => console.error(e));
                if (bpt) osmoBusiness = bpt;
            }
            feeSats = await this.ibexService.estimateInvoiceAddress(data.address.toLowerCase(), amountSats ?? 0);
        } else {
            if (data.amountSats && data.amountSats <= 0) throw new BadRequestException('El monto debe ser mayor que 0');
            feeSats = await this.ibexService.estimateOnChainAddress(data.address, data.amountSats ?? 0);
        }
        return {
            fee: feeSats,
            osmoBusiness: osmoBusiness,
            memo: memoDecrypted,
        };
    }

    async sendFiat(authUser: AuthUser, data: SendFiatDto) {
        if (data.mobile != null && data.receiverId != null) throw new BadRequestException('receiverId y mobile no pueden ir juntos');
        const manager = this.addressRepository.manager;
        let strategy;
        if (data.mobile != null && data.receiverId == null) {
            strategy = new SmsSendFiat(manager, authUser.sub, data, this.smsService);
        } else {
            strategy = new NormalSendFiat(manager, authUser.sub, data, this.pushNotificationService, this.googleCloudTasksService);
        }
        const fiatContext = new SendFiatContext(strategy);

        return await fiatContext.executeSend();
    }
}
