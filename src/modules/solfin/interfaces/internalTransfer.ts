import { UpdateBalanceTransferType } from "src/modules/balance-updater/enums/type.enum"

export interface SolfinInternalTransferPayload {
    userId: string
    currency: string
    amount: number
    internalTransferType: UpdateBalanceTransferType
}