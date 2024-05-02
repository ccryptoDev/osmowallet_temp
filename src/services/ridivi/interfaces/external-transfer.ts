import { RidiviCurrency } from '../enums/currency.enum';
import { RidiviExternalTransferType } from '../enums/transfer-type.enum';

export interface RidiviExternalTransfer {
    type: RidiviExternalTransferType;
    amount: number;
    currency: RidiviCurrency;
    iban: string;
    userId: string;
    transactionGroupId: string;
    description?: string;
}
