import { IsISO31661Alpha2 } from "class-validator";


export class TermsAndConditionsDto {

    @IsISO31661Alpha2()
    country: string
}