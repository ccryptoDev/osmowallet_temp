import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SendGloballyPartner } from '../enums/partner.enum';
import { SendGloballyStatus } from '../enums/status.enum';
import { Currencies } from './enums';
import { Invoice } from './types/invoice.type';
import { ErrorResponseDTO, OptionsResponseDTO, PayoutDTO, PayoutOptions, PayoutResponseDTO, RefundDTO } from './dtos';
import { AxiosResponse } from 'axios';


@Injectable()
export class TheBitcoinCompanyService {
    private baseURL = process.env.THE_BITCOIN_COMPANY_URL
    private apiKey = process.env.THE_BITCOIN_COMPANY_API_KEY
    private apiSecret = process.env.THE_BITCOIN_COMPANY_API_SECRET

    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(GlobalPayment) private globalPaymentsRepository: Repository<GlobalPayment>,
    ) { }

    async getOptions(currency: Currencies) {
        const URL = `${this.baseURL}/remittance/options?currency=${currency}`
        console.log(this.apiKey, this.apiSecret)
        const response = await firstValueFrom<AxiosResponse<OptionsResponseDTO, ErrorResponseDTO>>(this.httpService.get(URL, {
            method: 'GET',
            headers: {
                'x-api-key': this.apiKey,
                'x-api-secret': this.apiSecret
            }
        }))
        return response.data
    }

    async createInvoice({ amount, targetCurrency, payoutOption: { id: payoutOption, requiredFields: payoutRequiredFields } }: PayoutDTO) {
        const requiredFields = this.getRequiredFields(payoutRequiredFields)
        const URL = `${this.baseURL}/remittance/invoice`
        const data = {
            id: uuidv4(),
            amount: amount,
            currency: "BTC",
            targetCurrency: targetCurrency,
            webhook: `${process.env.DOMAIN}/send-globally/the-bitcoin-company/webhook`,
            payoutOption: {
                id: payoutOption,
                requiredFields,
            }
        } satisfies Invoice
        const config = {
            headers: {
                'x-api-key': this.apiKey,
                'x-api-secret': this.apiSecret
            }
        }

        const response = await firstValueFrom<AxiosResponse<PayoutResponseDTO, ErrorResponseDTO>>(this.httpService.post(URL, data, config))

        await this.globalPaymentsRepository.insert({
            amount: response.data.result.destExchangeData.price,
            currency: targetCurrency,
            sats: amount * 100_000_000,
            flow: payoutOption,
            payoutId: response.data.result.destExchangeData.id,
            address: response.data.result.destExchangeData.pr,
            partner: SendGloballyPartner.THE_BITCOIN_COMPANY,
            status: SendGloballyStatus.PENDING,
        })


        return {
            id: response.data.result.destExchangeData.id,
            pr: response.data.result.destExchangeData.pr,
        }
    }

    async refundInvoice(payload: RefundDTO) {
        const URL = `${this.baseURL}/remittance/refund`
        const data = {
            id: payload.id,
            pr: payload.pr,
        }
        const config = {
            headers: {
                'x-api-key': this.apiKey,
                'x-api-secret': this.apiSecret
            }
        }
        try {
            const response = await firstValueFrom<AxiosResponse<any, ErrorResponseDTO>>(this.httpService.post(URL, data, config))
            return response.data
        } catch (error) {
            return error.data
        }
    }

    async manageEvent(body: any) {
        const globalPayment = await this.globalPaymentsRepository.findOne({
            where: {
                payoutId: body.id
            }
        })

        if (body.status == 'PAID') {
            await this.globalPaymentsRepository.update(globalPayment.id, {
                status: SendGloballyStatus.PAID
            })
        }

        if (body.status == 'REFUNDED') {
            await this.globalPaymentsRepository.update(globalPayment.id, {
                status: SendGloballyStatus.FAILED
            })
        }

        return
    }

    getRequiredFields(payoutOption: PayoutOptions) {
        const requiredFields: Array<{ name: string, value: string }> = []
        for (const key in payoutOption) {
            requiredFields.push({
                name: key,
                value: payoutOption[key]
            })
        }
        return requiredFields
    }
}





