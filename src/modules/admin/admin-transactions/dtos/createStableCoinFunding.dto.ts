import { IsNumber, IsUUID } from "class-validator";


export class AdminStableDto {
    
    @IsUUID()
    userId: string

    @IsUUID()
    coinId: string

    @IsNumber()
    amount: number
}