import {  IsNumber, IsOptional, IsPositive, IsString } from "class-validator"
import { IbexLightningTransaction } from "./ibexLightningTransaction"


export class PayLnURLResponse{
    @IsString()
    hash: string

    @IsPositive()
    amountMsat: number

    @IsNumber()
    feesMsat: number

    @IsOptional()
    settledAtUtc: string
    
    @IsOptional()
    transaction: IbexLightningTransaction
}

