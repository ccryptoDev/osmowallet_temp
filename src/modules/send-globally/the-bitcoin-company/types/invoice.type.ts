import { Currencies, PayoutOptionEnum } from "../enums";

export type Invoice = {
    id: string;
    amount: number;
    currency: string;
    targetCurrency: Currencies;
    webhook: string;
    payoutOption: {
        id: PayoutOptionEnum;
        requiredFields: {
            name: string;
            value: string;
        }[];
    };
};