import Decimal from 'decimal.js';
import * as ln from 'lnurl';
import { Address } from 'src/entities/address.entity';
import { BalanceUpdaterService } from 'src/modules/balance-updater/balance-updater.service';
import { UpdateBalance } from 'src/modules/balance-updater/interfaces/updateBalance';
import { IbexService } from 'src/modules/ibex/ibex.service';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { EntityManager } from 'typeorm';
import { RefundSendDto } from '../dtos/refund.dto';
import { CreateTransaction } from '../dtos/transaction.dto';
import { PayLnURLErrorInBuyIfEmpty } from '../exceptions/send.exception';
import { SendBtcData } from './send.data';

export class Send {
    private createUrl = `https://${process.env.DOMAIN}/send/transactions/create/v2`;
    private refundUrl = `https://${process.env.DOMAIN}/send/transactions/refund`;
    private sendQueue = `SEND-BTC-${process.env.ENV}`;
    private refundQueue = `SEND-BTC-REFUND-${process.env.ENV}`;
    constructor(
        protected ibexService: IbexService,
        protected googleCloudTasksService: GoogleCloudTasksService,
        protected manager: EntityManager,
    ) {}

    addToBalanceUpdaterQueue(data: UpdateBalance) {
        this.googleCloudTasksService.createInternalTask(BalanceUpdaterService.queue, data, BalanceUpdaterService.url);
    }

    async doFastBuy(data: CreateTransaction) {
        const userAddresses = await this.manager.findOne(Address, {
            where: {
                user: { id: data.user.sub },
            },
        });
        if (!userAddresses) throw new Error('User has no addresses');

        const lnURLDecode = ln.decode(userAddresses.lnUrlPayer);
        const paramsToBuy = await this.ibexService.getParams(lnURLDecode);
        try {
            const amountToBuy = new Decimal(data.payload.amount).plus(data.payload.feeSat).times(1000);
            await this.ibexService.payLnURL(paramsToBuy, amountToBuy.toNumber(), process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID ?? '');
        } catch (error) {
            throw new PayLnURLErrorInBuyIfEmpty();
        }
    }

    async addTransactionToQueue(data: CreateTransaction) {
        this.googleCloudTasksService.createInternalTask(this.sendQueue, data, this.createUrl);
    }

    async addToRefundQueue(data: RefundSendDto) {
        this.googleCloudTasksService.createInternalTask(this.refundQueue, data, this.refundUrl);
    }
}

export class SendContext implements SendBtc {
    constructor(private strategy: SendBtc) {}

    async sendNative(data: SendBtcData): Promise<any> {
        await this.strategy.sendNative(data);
    }

    async sendAutoconvert(data: SendBtcData): Promise<void> {
        await this.strategy.sendAutoconvert(data);
    }

    async createNativeTransactions(data: CreateTransaction): Promise<any> {
        this.strategy.createNativeTransactions(data);
    }

    async createAutoconvertTransactions(data: CreateTransaction): Promise<any> {
        this.strategy.createAutoconvertTransactions(data);
    }
}

export interface SendBtc {
    sendNative(data: SendBtcData): Promise<void>;

    sendAutoconvert(data: SendBtcData): Promise<void>;

    createNativeTransactions(data: CreateTransaction): Promise<void>;

    createAutoconvertTransactions(data: CreateTransaction): Promise<void>;
}
