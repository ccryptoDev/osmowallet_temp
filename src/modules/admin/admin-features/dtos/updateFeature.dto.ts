import { IsNumber } from "class-validator"


export class UpdateFeatureDto {
    @IsNumber()
    max: number

    @IsNumber()
    min: number

    @IsNumber()
    fee: number

    @IsNumber()
    dailyLimit: number

    @IsNumber()
    monthlyLimit: number
}