import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { GlobalPaymentCountry } from 'src/entities/globalPaymentCountry.entity';
import { Repository } from 'typeorm';
import { SendGloballyPartner } from './enums/partner.enum';
import { StrikeService } from './strike/strike.service';
import { SendGloballyFlow } from './enums/flow.enum';
import { SendGloballyAddressDto } from './dtos/send.dto';
import { TheBitcoinCompanyService } from './the-bitcoin-company/the-bitcoin-company.service';

@Injectable()
export class SendGloballyService {
    static queue = `SEND-GLOBALLY-${process.env.ENV}`
    static url = `https://${process.env.DOMAIN}/send-globally`

    constructor(
        @InjectRepository(GlobalPaymentCountry) private globalPaymentCountryRepository: Repository<GlobalPaymentCountry>,
        @InjectRepository(GlobalPayment) private globalPaymentRepository: Repository<GlobalPayment>,
        private strikeService: StrikeService,
        private theBitcoinCompanyService: TheBitcoinCompanyService
    ) { }

    async managePayment(data: SendGloballyAddressDto) {
        const globalPayment = await this.globalPaymentRepository.findOneBy({
            address: data.address
        })
        if (!globalPayment) return

        switch (globalPayment.partner) {
            case SendGloballyPartner.STRIKE:
                if (globalPayment.flow === SendGloballyFlow.BANK) {
                    this.strikeService.initiatePayout(globalPayment.payoutId)
                }
                break;
        }

    }

    async getGlobalPaymentCountries() {
        return this.globalPaymentCountryRepository.find({
            relations: {
                country: true
            }
        })
    }
}
