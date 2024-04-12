import { IsNumber, IsOptional, IsString } from "class-validator"
import { StrikeInvoiceDto } from "./invoice.dto"


export class CreateStrikeUserInvoiceDto extends StrikeInvoiceDto{

    @IsString()
    username: string

}