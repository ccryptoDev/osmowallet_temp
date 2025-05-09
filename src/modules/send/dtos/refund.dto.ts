import { CreateTransaction } from './transaction.dto';

export interface RefundSendDto {
    transactionGroupId?: string;

    createSendTransaction: CreateTransaction;

    refundToOsmo: boolean;
}
