import { IsBoolean, IsCreditCard, IsEnum, IsNumber, IsString, Length, Max, Min } from "class-validator"
import { BrandCard } from "../enums/brand-card.enum"


export class CreateCardDto {
    @IsCreditCard()
    number: string
    
    @IsNumber()
    @Min(1)
    @Max(12)
    expMonth: number

    @IsNumber()
    @Min(2024)
    expYear: number

    @IsString()
    @Length(3, 4)
    cvv: string

    @IsString()
    holderName: string

    @IsEnum(BrandCard)
    brand: BrandCard

    @IsString()
    alias: string

    @IsBoolean()
    isDefault: boolean
}