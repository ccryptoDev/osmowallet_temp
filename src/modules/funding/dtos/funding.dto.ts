import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator"

export class FundingDto {

    @IsUUID()
    coinId: string

    @IsUUID()
    fundingMethodId: string

    @IsNotEmpty()
    amount: number

    @IsString()
    @IsOptional()
    data?: string

    @IsString()
    @IsOptional()
    partner?: string
}