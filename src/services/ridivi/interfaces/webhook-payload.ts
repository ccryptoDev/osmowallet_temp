export interface RidiviWebhookPayload {
    customerIdNumber: string;
    customerTypeIdNumber: number;
    numMov: number;
    sinpeReference: string;
    approvalDate: string;
    transactionType: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    origin: {
        id: string;
        name: string;
        iban: string;
        entityCode: string;
        phone: string;
    };
    destination: {
        id: string;
        name: string;
        iban: string;
        entityCode: string;
        phone: string;
    };
    connection: string;
    user: string;
}
