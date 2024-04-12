import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator"
import { BankDataDto } from "./bankData.dto"
import { PartnerFlow } from "../enums/partnerFlow.enum"
import { Type } from "class-transformer"



export class PartnerGenerateInvoiceDto {

    @IsString()
    @IsNotEmpty()
    referenceId: string

    @IsString()
    @IsNotEmpty()
    phoneNumber: string

    @IsNumber()
    @IsNotEmpty()
    amount: number

    @IsString()
    @IsNotEmpty()
    description: string
    
    @Type(() => BankDataDto)
    @IsOptional()
    @ValidateNested()
    bankAddress: BankDataDto

    @IsEnum(PartnerFlow)
    flowType: PartnerFlow

}

