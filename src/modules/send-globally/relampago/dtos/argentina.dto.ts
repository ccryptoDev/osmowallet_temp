import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { ArgentinaAccountType } from "../enums/argentinaAccountType.enum";
import { RelampagoCurrency } from "../enums/currency.enum";


export class ArgentinaQuoteDto {

    @IsString()
    beneficiary: string

    @IsOptional()
    currency: RelampagoCurrency.ARG

    @IsEnum(ArgentinaAccountType)
    accountType: ArgentinaAccountType

    @IsString()
    accountNumber: string

    @IsInt()
    amountSats: number
}