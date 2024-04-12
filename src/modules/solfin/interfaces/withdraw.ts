

export interface SolfinWithdrawPayload {
    userId: string
    iban_to: string;
    name_to: string;
    email_to: string;
    document_to: string;
    document_type_to: string;
    currency: string;
    amount: number;
    description: string;
}
