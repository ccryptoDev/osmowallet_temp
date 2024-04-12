import { IsNotEmpty, IsNumber } from "class-validator";


export class InvoiceDto{
    @IsNumber()
    amountSats: number

    @IsNumber()
    btcPrice: number
}

export class InvoiceDtoV2 {
    @IsNumber()
    amountSats: number

    @IsNotEmpty()
    rocket: any

    btcPrice?: number
}