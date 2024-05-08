import { UpdateBalanceTransferType } from '../enums/type.enum';

export interface UpdateBalance {
    amount: number;
    coinId: string;
    type: UpdateBalanceTransferType;
    userId: string;
}
