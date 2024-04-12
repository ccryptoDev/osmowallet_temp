import { IsEnum, IsNumber, IsPositive, IsUUID } from "class-validator";
import { FiatCoinPreference } from "src/modules/me/enums/fiatCoinPreference.enum";



export class CashpakWithdrawDto{
    
    @IsPositive()
    @IsNumber()
    amount: number

    @IsUUID()
    coinId: string
}