import { TransactionSubtype } from "../enums/transactionSubtype.enum";

export const typeSubtypes = {
    'SEND' : [TransactionSubtype.DEBIT_FIAT_BUY],
    'AUTOCONVERT' : [TransactionSubtype.CREDIT_FIAT_SELL],
    'SWAP' : [TransactionSubtype.DEBIT_FIAT_BUY, TransactionSubtype.CREDIT_FIAT_SELL],
    'RECEPTION' : [TransactionSubtype.CREDIT_BTC_TRANSFER_ONCHAIN, TransactionSubtype.CREDIT_BTC_TRANSFER_LN],
    'WITHDRAW' : [TransactionSubtype.DEBIT_FIAT_WITHDRAW],
    'CASHOUT' : [TransactionSubtype.DEBIT_BTC_WITHDRAW_CASHOUT],
    'FUNDING' : [TransactionSubtype.CREDIT_FIAT_FUNDING],
    'REFERRAL' : [TransactionSubtype.DEBIT_REFERRAL_OSMO],
    'TRANSACTION' : [TransactionSubtype.CREDIT_FIAT_TRANSFER, TransactionSubtype.DEBIT_FIAT_TRANSFER],
    'RECURRENT_BUY' : [TransactionSubtype.DEBIT_FIAT_BUY]
  }

export const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const