import { IsPort, IsPositive, IsUUID } from "class-validator";


export class RecurrentBuyDto {

    @IsPositive()
    amount: number

    @IsUUID()
    coinId: string

    @IsUUID()
    periodId: string

}