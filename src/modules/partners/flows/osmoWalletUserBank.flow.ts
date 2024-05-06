import { PartnerStatus } from "../enums/partnerEvent.enum";
import { PartnerFlowStrategy } from "./partner.flow";
import { IbexService } from "src/modules/ibex/ibex.service";
import { EntityManager} from "typeorm";
import { LightningInvoiceDto } from "src/modules/webhooks/dtos/receiveInvoice.dto";
import { User } from "src/entities/user.entity";
import { OsmoWalletUserFlow } from "./osmoWalletUser.flow";
import { SendGridService } from "src/modules/send-grid/send-grid.service";
import { PartnerInvoice } from "src/schemas/partnerInvoice.schema";
import { PartnerWithdraw } from "src/modules/withdraw/strategies/partnerWithdraw.strategy";
import { Model } from "mongoose";


export class OsmoWalletUserBank implements PartnerFlowStrategy{
    
    constructor(
        private manager: EntityManager,        
        private partnerInvoice: PartnerInvoice,
        private ibexService: IbexService,
        private invoice: LightningInvoiceDto,
        private user: User,
        private sendGridService: SendGridService,
        private partnerModel: Model<PartnerInvoice>,
        ){}
    
    async deposit(): Promise<PartnerStatus> {
        const osmoUserStrategy = new OsmoWalletUserFlow(
            this.manager,
            this.partnerInvoice,
            this.ibexService,
            this.user,
            this.invoice,
            )
        const response = await osmoUserStrategy.deposit()
        if(response == PartnerStatus.SUCCESS){
            const bankStrategy = new PartnerWithdraw(
                this.partnerModel,
                this.partnerInvoice,
                this.sendGridService,
                this.manager,
                this.user
            )
            bankStrategy.withdraw()
            return PartnerStatus.SUCCESS
        }
        return PartnerStatus.FAILED
    }

    
}