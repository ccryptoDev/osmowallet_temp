import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';
import axios, { isAxiosError } from 'axios';
import Decimal from 'decimal.js';
import { Model } from 'mongoose';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';
import { StrikeBankPaymentMethod } from 'src/schemas/strikeBankPaymentMethod.schema';
import { Repository } from 'typeorm';
import { SendGloballyPartner } from '../enums/partner.enum';
import { SendGloballyStatus } from '../enums/status.enum';
import { StrikeBankInvoiceDto } from './dtos/bankInvoice.dto';
import { StrikeBankPaymentMethodDto } from './dtos/bankPaymentMethod.dto';
import { CreateStrikeUserInvoiceDto } from './dtos/strikeUserInvoice.dto';
import { StrikeEventUpdate } from './interfaces/eventUpdate.interface';
import { StrikeInvoice } from './interfaces/invoice.interface';
import { StrikePayout } from './interfaces/payout.dto';
import { StrikeQuote } from './interfaces/quote.interface';
import { StrikeRate } from './interfaces/rate.interface';

@Injectable()
export class StrikeService {
    private baseURL = 'https://api.strike.me/v1';

    constructor(
        @InjectRepository(GlobalPayment) private globalPaymentsRepository: Repository<GlobalPayment>,
        @InjectModel(StrikeBankPaymentMethod.name) private strikeBankPaymentMethodModel: Model<StrikeBankPaymentMethod>,
    ) {
        this.getSubscriptions();
    }

    async initiatePayout(payoutId: string) {
        try {
            const config = {
                url: `${this.baseURL}/payouts/${payoutId}/initiate`,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
                },
            };

            const response = await axios(config);
            return response.data;
        } catch (error) {
            Sentry.captureException(error);
        }
    }

    async createQuote(invoiceId: string): Promise<StrikeQuote> {
        const config = {
            baseURL: this.baseURL,
            url: `/invoices/${invoiceId}/quote`,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
            },
        };
        const response = await axios(config);
        return response.data;
    }

    private async createBankInvoice(data: StrikeBankInvoiceDto, correlationId: string): Promise<StrikeInvoice> {
        const config = {
            baseURL: this.baseURL,
            url: `/invoices/`,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
            },
            data: {
                correlationId: correlationId,
                description: data.description,
                amount: {
                    currency: 'USD',
                    amount: data.amount.toFixed(2),
                },
            },
        };
        const response = await axios(config);
        return response.data;
    }

    private async createInvoiceForStrikeUser(data: CreateStrikeUserInvoiceDto, correlationId: string): Promise<StrikeInvoice> {
        const config = {
            baseURL: this.baseURL,
            url: `/invoices/handle/${data.username}`,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
            },
            data: {
                correlationId: correlationId,
                description: data.description,
                amount: {
                    currency: 'USD',
                    amount: data.amount.toFixed(2),
                },
            },
        };
        const response = await axios(config);
        return response.data;
    }

    async getInvoiceById(id: string): Promise<StrikeInvoice> {
        const config = {
            method: 'get',
            baseURL: this.baseURL,
            url: `/invoices/${id}`,
            headers: {
                Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
            },
        };
        const response = await axios(config);
        return response.data;
    }

    async manageEvent(event: StrikeEventUpdate) {
        console.log(event);
        this.getInvoiceById(event.data.entityId)
            .then(async (invoice) => {
                await this.globalPaymentsRepository.update(invoice.correlationId, {
                    status: SendGloballyStatus[invoice.state as keyof typeof SendGloballyStatus],
                });
            })
            .catch((error) => {
                Sentry.captureException(error);
            });
    }

    async getSubscriptions() {
        const config = {
            baseURL: this.baseURL,
            url: '/subscriptions',
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
            },
        };
        const response = await axios(config);
        return response.data;
    }

    async createStrikeBankPaymenMethod(body: StrikeBankPaymentMethodDto) {
        try {
            const config = {
                method: 'post',
                url: '/payment-methods/bank',
                baseURL: this.baseURL,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
                },
                data: JSON.stringify(body),
            };
            const response = await axios(config);
            return response.data;
        } catch (error) {
            Sentry.captureException(error);
            if (isAxiosError(error)) {
                if (error?.response?.status == 400) {
                    throw new BadRequestException(error.response.data.data.message);
                }
            }
            throw error;
        }
    }

    async createPayoutObject(body: StrikeBankInvoiceDto, paymentMethodId: string): Promise<StrikePayout> {
        try {
            const config = {
                method: 'post',
                url: '/payouts',
                baseURL: this.baseURL,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
                },
                data: {
                    amount: body.amount,
                    paymentMethodId: paymentMethodId,
                },
            };
            const response = await axios(config);
            return response.data;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    async deleteStrikePaymentMethod(id: string) {
        try {
            const config = {
                method: 'delete',
                url: `${id}`,
                baseURL: this.baseURL,
                headers: {
                    Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
                },
            };
            await axios(config);
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    ////// PUBLIC

    async getRates() {
        try {
            const config = {
                method: 'GET',
                baseURL: this.baseURL,
                url: '/rates/ticker',
                headers: {
                    Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
                },
            };
            const response = await axios(config);
            const rates = <StrikeRate[]>response.data;
            const rate = rates.find((rate) => rate.sourceCurrency == 'BTC' && rate.targetCurrency == 'USD');
            if (!rate) throw new BadRequestException('Rate not found');
            return {
                btcPrice: new Decimal(rate.amount).toNumber(),
            };
        } catch (error) {
            throw error;
        }
    }

    async generateInvoiceForStrikeUser(data: CreateStrikeUserInvoiceDto) {
        try {
            const globalShipment = this.globalPaymentsRepository.create({
                amount: data.amount,
                currency: 'USD',
                partner: SendGloballyPartner.STRIKE,
                status: SendGloballyStatus.UNPAID,
            });
            await this.globalPaymentsRepository.insert(globalShipment);
            const invoiceResponse = await this.createInvoiceForStrikeUser(data, globalShipment.id);
            const quoteResponse = await this.createQuote(invoiceResponse.invoiceId);
            const sats = new Decimal(quoteResponse.sourceAmount.amount).times(Math.pow(10, 8));
            this.globalPaymentsRepository.update(globalShipment.id, {
                sats: sats.floor().toNumber(),
                address: quoteResponse.lnInvoice,
                quoteId: quoteResponse.quoteId,
                flow: 'USER',
            });
            return quoteResponse;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    async generateBankInvoice(data: StrikeBankInvoiceDto) {
        try {
            const paymentMethod = await this.strikeBankPaymentMethodModel.findOne({ _id: data.paymentMethodId });
            if (!paymentMethod) throw new BadRequestException('Invalid payment method');

            const globalShipment = this.globalPaymentsRepository.create({
                amount: data.amount,
                currency: 'USD',
                partner: SendGloballyPartner.STRIKE,
                status: SendGloballyStatus.UNPAID,
                flow: 'BANK',
            });
            await this.globalPaymentsRepository.insert(globalShipment);
            const invoiceResponse = await this.createBankInvoice(data, globalShipment.id);
            const quoteResponse = (await this.createQuote(invoiceResponse.invoiceId)) as StrikeQuote & { payoutId?: string };
            const sats = new Decimal(quoteResponse.sourceAmount.amount).times(Math.pow(10, 8));

            const payoutResponse = await this.createPayoutObject(data, paymentMethod.strikeId);
            this.globalPaymentsRepository.update(globalShipment.id, {
                sats: sats.floor().toNumber(),
                quoteId: quoteResponse.quoteId,
                address: quoteResponse.lnInvoice,
                payoutId: payoutResponse.id,
            });
            quoteResponse['payoutId'] = payoutResponse.id;
            return quoteResponse;
        } catch (error) {
            Sentry.captureException(error);
            throw error;
        }
    }

    async getUserByUsername(username: string) {
        try {
            const config = {
                baseURL: this.baseURL,
                url: `/accounts/handle/${username}/profile`,
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.STRIKE_API_KEY}`,
                },
            };
            const response = await axios(config);
            return response.data;
        } catch (error) {
            Sentry.captureException(error);
            if (isAxiosError(error)) {
                if (error?.response?.status == 404) {
                    throw new BadRequestException('User not found');
                }
                throw error;
            }
        }
    }

    ////// BANKS ACCOUNTS

    async deleteBankPaymentMethod(id: string) {
        const paymentMethod = await this.strikeBankPaymentMethodModel.findOne({ _id: id });
        if (!paymentMethod) throw new BadRequestException('Invalid payment method');
        await this.deleteStrikePaymentMethod(id);
        await this.strikeBankPaymentMethodModel.findOneAndRemove({ _id: id });
    }

    async getStrikeBankPaymentMethods(authUser: AuthUser) {
        const paymentMethods = await this.strikeBankPaymentMethodModel.find({ userId: authUser.sub });
        return paymentMethods;
    }

    async storeBankPaymentMethod(authUser: AuthUser, body: StrikeBankPaymentMethodDto) {
        const response = await this.createStrikeBankPaymenMethod(body);
        await this.strikeBankPaymentMethodModel.create({
            transferType: body.transferType,
            accountNumber: body.accountNumber,
            accountType: body.accountType,
            bankAddress: body.bankAddress,
            bankName: body.bankName,
            routingNumber: body.routingNumber,
            strikeId: response['id'],
            userId: authUser.sub,
            beneficiaries: body.beneficiaries,
        });
    }
}
