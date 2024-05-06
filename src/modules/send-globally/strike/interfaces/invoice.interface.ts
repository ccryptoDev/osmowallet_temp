
export interface StrikeInvoice {
    invoiceId: string;
    amount: {
        amount: string;
        currency: string;
    };
    state: string;
    created: string;
    correlationId: string;
    description: string;
    issuerId: string;
    receiverId: string;
}
