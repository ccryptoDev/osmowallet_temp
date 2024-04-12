import { SinpeMovilWithdrawDto } from "src/modules/withdraw/dtos/sinpe-movil.withdraw.dto"

export interface SinpeMobileWithdrawPayload extends SinpeMovilWithdrawDto{
    userId: string
    currency: string
    amount: number
}