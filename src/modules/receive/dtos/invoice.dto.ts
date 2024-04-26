import { IsNumber } from "class-validator";


export class InvoiceDto{
    @IsNumber()
    amountSats: number

    @IsNumber()
    btcPrice: number
}