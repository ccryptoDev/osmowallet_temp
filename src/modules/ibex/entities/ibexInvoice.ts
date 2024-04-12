import { IsOptional } from "class-validator"
import { IbexState } from "./ibexState"


export class IbexInvoice{

    hash: string

    bolt11: string

    preImage: string

    memo: string

    creationDateUtc: string
    
    expiryDateUtc: string

    settleDateUtc: string

    amountMsat: number

    receiveMsat: number

    stateId: number

    @IsOptional()
    state: IbexState
}