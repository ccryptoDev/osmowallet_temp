import { IsNumber, IsString } from "class-validator";


export class UpdateFundingMethodDto {

    @IsNumber()
    max: number

    @IsNumber()
    min: number

    @IsNumber()
    fee: number

    @IsString()
    estimateTime: string

    @IsString()
    description: string
}