import { IsString } from "class-validator";


export class UpdateRelampagoInvoiceDto {
    
    @IsString()
    event: string;

    @IsString()
    txId: string
}