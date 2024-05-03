export type DtrLoadTransfer = {
    fromId: string;
    fromIban: string;
    toId: string;
    toIban: string;
    time: string;
    service: string;
    currency: string;
    amount: number;
    text: string;
    clientReference?: string;
};
