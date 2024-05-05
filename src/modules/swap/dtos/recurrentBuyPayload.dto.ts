import { RecurrentBuy } from "src/entities/recurrent.buy.entity"


export interface RecurrentBuyPayload{
    btcPrice: number
    amount: number
    coinId: string
    periodId: string
    userId: string
}