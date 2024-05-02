import { UpdateBalanceTransferType } from 'src/modules/balance-updater/enums/type.enum';

export interface InternalTransfer {
    userId: string;
    amount: number;
    currency: string;
    type: UpdateBalanceTransferType;
}
