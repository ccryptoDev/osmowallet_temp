import {  IsNotEmpty, IsOptional, IsPositive, IsString } from "class-validator"
import { IbexLightningTransaction } from "../../ibex/entities/ibexLightningTransaction"


export class LightningInvoiceDto{
    @IsString()
    @IsOptional()
    hash: string

    @IsPositive()
    @IsOptional()
    receivedMsat: number

    @IsString()
    @IsOptional()
    settledAtUtc: string

    @IsString()
    webhookSecret: string
    
    @IsNotEmpty()
    transaction: IbexLightningTransaction
}

