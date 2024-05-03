import { PartnerFlowStrategy } from './partner.flow';
import { PartnerStatus } from '../enums/partnerEvent.enum';
import { IbexService } from 'src/modules/ibex/ibex.service';
import { EntityManager } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { OsmoWalletUserFlow } from './osmoWalletUser.flow';
import { SmsService } from 'src/services/sms/sms.service';
import { PartnerInvoice } from 'src/schemas/partnerInvoice.schema';
import * as ln from 'lnurl';

export class NoOsmoUserWallet implements PartnerFlowStrategy {
    constructor(
        private manager: EntityManager,
        private partnerInvoice: PartnerInvoice,
        private ibexService: IbexService,
        private user?: User,
    ) {}

    async notify(smsService: SmsService) {
        const targetAmount = this.partnerInvoice.targetAmount;
        smsService.sendSMS({
            message: `Has recibido ${targetAmount.amount} ${targetAmount.currency} de Strike. Haz click aquí en el enlace para redimirlos: https://osmowallet.com`,
            phoneNumber: this.partnerInvoice.phoneNumber,
        });
    }

    async redirectToOsmoGtqWallet(amountMSats: number) {
        const lnURLDecode = ln.decode(process.env.IBEX_OSMO_LNURL_ADDRESS_PAYER ?? '');
        const params = await this.ibexService.getParams(lnURLDecode);
        await this.ibexService.payLnURL(params, amountMSats, process.env.IBEX_NATIVE_OSMO_ACCOUNT_ID ?? '');
    }

    async deposit(): Promise<PartnerStatus> {
        if (!this.user) {
            throw new Error('User not found');
        }
        const strategy = new OsmoWalletUserFlow(this.manager, this.partnerInvoice, this.ibexService, this.user);
        const response = await strategy.deposit(true);
        return response;
    }
}
