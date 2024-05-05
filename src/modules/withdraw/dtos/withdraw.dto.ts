import { IsNumber, IsOptional, IsString, IsUUID } from "class-validator"


export class WithdrawDto {
    
    @IsNumber()
    amount: number

    @IsUUID()
    coinId: string

    @IsString()
    withdrawMethodId: string

    @IsString()
    data: string

    @IsString()
    @IsOptional()
    partner: string
}