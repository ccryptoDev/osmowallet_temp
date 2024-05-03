import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmptyObject, IsString } from 'class-validator';
import { IbexLightningPaymentTransaction } from '../../ibex/entities/ibexLightningTransaction';

export class PayingInvoiceDto {
    @ApiProperty({
        description: 'Webhook secret',
        example: 'mySecret',
    })
    @IsString()
    webhookSecret!: string;

    @ApiProperty({
        description: 'Transaction details',
        example: {
            /* example transaction object */
        },
    })
    @IsNotEmptyObject()
    transaction!: IbexLightningPaymentTransaction;
}
