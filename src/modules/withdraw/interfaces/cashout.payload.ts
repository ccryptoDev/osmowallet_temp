import { AuthUser } from "src/modules/auth/payloads/auth.payload";
import { AmountCreateTransaction, BalanceCreateTransaction } from "src/modules/send/dtos/transaction.dto";
import { Wallets } from "src/modules/swap/dtos/swapTransaction.dto";
import { CashoutWithdrawDto } from "../dtos/cashoutWithdraw.dto";



export interface CashOutPayload {
    id: string;
    user: AuthUser;
    payload: CashoutWithdrawDto;
    balances: BalanceCreateTransaction;
    amounts: AmountCreateTransaction;
    btcPrice: number;
    wallets: Wallets;
    gtqRate: number
}