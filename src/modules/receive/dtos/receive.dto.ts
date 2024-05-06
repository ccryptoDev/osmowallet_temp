import { IsEnum, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsUUID } from "class-validator";
import { ReceiveMethod } from "../enums/receive.enum";


export class ReceiveDto {
    
    @IsEnum(ReceiveMethod)
    method: ReceiveMethod

    @IsNotEmpty()
    amount: number

    @IsUUID()
    userId: string

    @IsUUID()
    coinId: string

    @IsOptional()
    data: any
}