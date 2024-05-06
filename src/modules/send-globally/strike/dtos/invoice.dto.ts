import { IsNumber, IsOptional, IsString } from "class-validator";


export class StrikeInvoiceDto{
    @IsString()
    @IsOptional()
    description: string = ''

    @IsNumber()
    amount: number
}