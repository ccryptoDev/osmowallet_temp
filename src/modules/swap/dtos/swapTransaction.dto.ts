import { TransactionType } from "src/common/enums/transactionsType.enum";
import { AuthUser } from "src/modules/auth/payloads/auth.payload";
import { WalletSwap } from "../enums/swapWallet.enum";
import { SwapDto } from "./swap.dto";


export interface SwapTransactionDto{
    wallet: WalletSwap
    transactionType: TransactionType
    payload: SwapDto
    user: AuthUser
    balances: SwapBalances
    amounts: SwapAmounts
    fiatToFiat: boolean
    wallets: Wallets
}

interface SwapBalances {
    userFiatBalance: number
    osmoFeeBalance: number
    userSatsBalance: number
}

interface SwapAmounts {
    osmoFeeAmount: number
    userFiatAmount: number,
    userSatsAmount: number
}

export interface Wallets {
    osmoFeeWallet?: string
    userFiatWallet?: string
    userSatsWallet?: string
}