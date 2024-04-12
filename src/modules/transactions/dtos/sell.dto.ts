import { IsPositive, IsUUID } from "class-validator"


export class SellDto{

    @IsPositive()
    amountSats: number
    
    @IsUUID()
    coinId: string
}