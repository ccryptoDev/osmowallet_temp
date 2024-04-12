

export interface SolfinFundingPayload {
    userId: string
    ibanFrom: string;
    nameFrom: string;
    emailFrom: string;
    documentFrom: string;
    documentTypeFrom: number;
    currency: string;
    amount: number;
    description: string;
}
