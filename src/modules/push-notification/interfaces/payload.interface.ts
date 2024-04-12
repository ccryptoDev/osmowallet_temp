import { TransactionGroup } from "src/entities/transactionGroup.entity"
import MobileRoutePaths from "../enums/mobileRoutesPaths.enum"
import { MobileActionEnum } from "../enums/mobileAction.enum"
import { CoinEnum } from "src/modules/me/enums/coin.enum"

export interface PushPayload{
    title: string
    message: string
    data?: {
        route?: MobileRoutePaths
        currency?: string,
        amount?: string
    }
}