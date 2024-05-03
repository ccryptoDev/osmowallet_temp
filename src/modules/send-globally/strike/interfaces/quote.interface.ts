export interface StrikeQuote {
    quoteId: string;
    description: string;
    lnInvoice: string;
    expiration: string;
    expirationInSec: number;
    targetAmount: {
        amount: string;
        currency: string;
    };
    sourceAmount: {
        amount: string;
        currency: string;
    };
    conversionRate: {
        amount: string;
        sourceCurrency: string;
        targetCurrency: string;
    };
}
