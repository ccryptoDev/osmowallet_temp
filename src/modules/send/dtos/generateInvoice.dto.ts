import { IsEmail, IsInt } from "class-validator";


export class GenerateInvoiceFromEmail {

    @IsEmail()
    email: string

    @IsInt()
    amount: number
}