import { PartnerStatus } from "../enums/partnerEvent.enum"


export class PartnerFlowContext {
    private strategy: PartnerFlowStrategy

    constructor(strategy: PartnerFlowStrategy){
        this.strategy = strategy
    }
    
    async execute() : Promise<PartnerStatus> {
        return this.strategy.deposit()
    }
}

export interface PartnerFlowStrategy {

    deposit() : Promise<PartnerStatus>
}