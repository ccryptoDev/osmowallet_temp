export interface OnChainTransactionDto {
    transactionId: string;
    networkTransactionId: string;
    amountSat: number;
    feeSat: number;
    status: string;
    blockConfirmations: number;
    webhookSecret: string;
    transaction: OnChainTransaction;
}

interface OnChainTransaction {
    id: string;
    createdAt: string;
    settledAt: string;
    accountId: string;
    amount: number;
    networkFee: number;
    onChainSendFee: number;
    exchangeRateCurrencySats: number;
    currencyId: number;
    transactionTypeId: number;
}
