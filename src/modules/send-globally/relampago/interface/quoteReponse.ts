export interface RelampagoQuoteResponse {
    quoteId: string;
    lnInvoice: string;
    usdExchangeRate: number;
    recipientAmount: {
        amount: number;
        currency: string;
    };
}
