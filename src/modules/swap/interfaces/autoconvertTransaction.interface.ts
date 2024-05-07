import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { BalanceCreateTransaction } from 'src/modules/send/dtos/transaction.dto';
import { Wallets } from '../dtos/swapTransaction.dto';
import { AutoconvertToReceivePayload } from './autoconvert.interface';

export interface AutoconvertTransaction {
    transactionType: TransactionType;
    payload: AutoconvertToReceivePayload;
    balances: BalanceCreateTransaction;
    amounts: AutoconvertAmount;
    fiatToFiat: boolean;
    wallets: Wallets;
}

interface AutoconvertAmount {
    osmoFeeToCredit: number;
    userFiatToCredit: number;
    userBtcToCredit: number;
}
