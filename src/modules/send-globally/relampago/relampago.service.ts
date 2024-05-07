import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { Repository } from 'typeorm';
import { SendGloballyPartner } from '../enums/partner.enum';
import { SendGloballyStatus } from '../enums/status.enum';
import { RelampagoQuoteDto } from './dtos/quote.dto';
import { UpdateRelampagoInvoiceDto } from './dtos/updateStatus.dto';
import { RelampagoCountry } from './enums/countries.enum';
import { RelampagoCurrency } from './enums/currency.enum';
import { RelampagoQuoteResponse } from './interface/quoteReponse';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RelampagoService {
    private baseURL = process.env.RELAMPAGO_URL;
    constructor(
        private configService: ConfigService,
        @InjectRepository(GlobalPayment) private globalPaymentRepository: Repository<GlobalPayment>,
    ) {}

    private getAuthorizationToken(method: string, path: string, jsonBody?: any) {
        const nonce = Date.now().toString();

        let content = `${method} ${path} `;
        if (jsonBody != undefined) {
            content += JSON.stringify(jsonBody);
        }
        const relampagoApiKey = this.configService.getOrThrow<string>('RELAMPAGO_API_KEY');
        const hmac = crypto.createHmac('sha256', relampagoApiKey);

        const signatureHash = hmac.update(content).digest('base64');
        const token = `${process.env.RELAMPAGO_API_KEY_ID} ${nonce} ${signatureHash}`;
        return token;
    }

    async getQuote(body: any): Promise<RelampagoQuoteResponse> {
        try {
            const token = this.getAuthorizationToken('POST', '/quote', body);
            const config = {
                baseURL: this.baseURL,
                url: '/quote',
                method: 'POST',
                headers: {
                    Authorization: token,
                },
                data: body,
            };
            const response = await axios(config);
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw new BadRequestException(error?.response?.data);
            } else {
                throw new BadRequestException(error);
            }
        }
    }

    async getBanks(countryCode: RelampagoCountry) {
        try {
            const token = this.getAuthorizationToken('GET', '/banks');
            const config = {
                baseURL: this.baseURL,
                url: `/banks?countryCode=${countryCode}`,
                method: 'GET',
                headers: {
                    Authorization: token,
                },
            };
            const response = await axios(config);
            return response.data.banks;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw new BadRequestException(error?.response?.data);
            } else {
                throw new BadRequestException(error);
            }
        }
    }

    async generateInvoice(body: RelampagoQuoteDto) {
        const data = {
            satoshis: body.satoshis,
            recipientInfo: body.recipientInfo,
        };
        // if(body.countryCode == RelampagoCountry.MX) {

        // }
        // if(body.countryCode == RelampagoCountry.ARG){
        //     data = {
        //         satoshis: body.satoshis,
        //         countryCode: body.countryCode,
        //         currency: RelampagoCurrency[body.countryCode],
        //         recipientInfo:  body.recipientInfo,
        //     }
        // }
        const quote = await this.getQuote(data);
        const globalPayment = this.globalPaymentRepository.create({
            amount: quote.recipientAmount.amount,
            quoteId: quote.quoteId,
            currency: RelampagoCurrency[RelampagoCountry.MX].toUpperCase(),
            partner: SendGloballyPartner.RELAMPAGO,
            sats: body.satoshis,
            status: SendGloballyStatus.PENDING,
            address: quote.lnInvoice,
            flow: 'USER',
        });
        await this.globalPaymentRepository.insert(globalPayment);
        return quote;
    }

    async manageEvent(body: UpdateRelampagoInvoiceDto) {
        let status: SendGloballyStatus = SendGloballyStatus.PAID;
        if (body.event == 'FAILURE') {
            status = SendGloballyStatus.FAILED;
        }
        const globalPayment = await this.globalPaymentRepository.findOne({
            where: {
                quoteId: body.txId,
            },
        });

        if (!globalPayment) return;

        await this.globalPaymentRepository.update(globalPayment.id, {
            status: status,
        });
    }
}
