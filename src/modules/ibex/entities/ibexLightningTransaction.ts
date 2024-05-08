import { ApiProperty } from '@nestjs/swagger';
import { IbexInvoice } from './ibexInvoice';
import { IbexLightningPayment } from './payment';

export abstract class IbexLightningTransactionBase {
    @ApiProperty({ description: 'The ID of the transaction', example: '12345', required: true })
    id!: string;

    @ApiProperty({ description: 'The creation date of the transaction', example: '2022-01-01', required: true })
    createdAt!: string;

    @ApiProperty({ description: 'The ID of the account associated with the transaction', example: '67890', required: true })
    accountId!: string;

    @ApiProperty({ description: 'The amount of the transaction', example: 100.5, required: true })
    amount!: number;

    @ApiProperty({ description: 'The network fee of the transaction', example: 1.5, required: true })
    networkFee!: number;

    @ApiProperty({ description: 'The exchange rate in currency sats', example: 500, required: true })
    exchangeRateCurrencySats!: number;

    @ApiProperty({ description: 'The ID of the currency', example: 1, required: true })
    currencyId!: number;

    @ApiProperty({ description: 'The ID of the transaction type', example: 2, required: true })
    transactionTypeId!: number;
}

export class IbexLightningPaymentTransaction extends IbexLightningTransactionBase {
    @ApiProperty({
        description: 'The payment details',
        example: {
            /* payment object example */
        },
        required: true,
    })
    payment!: IbexLightningPayment;
}

export class IbexLightningTransaction extends IbexLightningTransactionBase {
    @ApiProperty({
        description: 'The invoice details',
        example: {
            /* invoice object example */
        },
        required: true,
    })
    invoice!: IbexInvoice;
}
