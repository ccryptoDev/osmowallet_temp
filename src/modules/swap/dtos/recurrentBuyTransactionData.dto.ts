import { Wallets } from "./swapTransaction.dto"


export interface RecurrentBuyTransactionData {
    passed: boolean,
    days: number,
    btcPrice: number,
    coinId: string,
    userId: string,
    amounts: AmountCreateTransactionRecurrentBuy,
    balances: BalanceCreateTransactionRecurrentBuy,
    wallets: Wallets
}

interface AmountCreateTransactionRecurrentBuy {
    totalUserFiatToDebit: number
    totalUserSatsToCredit: number
    osmoFiatFeeToCredit: number
}

interface BalanceCreateTransactionRecurrentBuy {
    userFiatBalance: number
    userSatsBalance: number
    osmoWalletFeeBalance: number
}

