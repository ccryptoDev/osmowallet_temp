import { SolfingCurrency } from "../enums/currency.enum"


export interface SolfinCreateAccountPayload {
    document: string
    document_type: string
    sinpeId?: string
    userId: string
}

export interface CreateNewSolfinIbanAccount {
    document: string
    document_type: string
    product_id: number
    description: string
    currency: SolfingCurrency
}