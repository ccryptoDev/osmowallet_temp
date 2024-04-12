import { IbexState } from "./ibexState"


export class IbexLightningPayment{

    bolt11: string

    hash: string

    preImage: string

    memo: string
    
    amountMsat: number

    feeMsat: number

    paidMsat: number

    creationDateUtc: string

    settleDateUtc: string
    
    statusId: number

    failureId: number

    failureReason: IbexFailureReason

    status: IbexState

}

class IbexFailureReason{
    id: number

    name: string

    description: string
}