import { IsOptional } from "class-validator"
import { IbexInvoice } from "./ibexInvoice"
import { IbexLightningPayment } from "./payment"


export abstract class IbexLightningTransactionBase{

    id: string

    createdAt: string

    accountId: string

    amount: number

    networkFee: number

    exchangeRateCurrencySats: number

    currencyId: number
    
    transactionTypeId: number
}

export class IbexLightningPaymentTransaction extends IbexLightningTransactionBase{
    payment: IbexLightningPayment
}

export class IbexLightningTransaction extends IbexLightningTransactionBase{
    invoice: IbexInvoice
}