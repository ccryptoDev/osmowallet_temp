import { IsOptional } from 'class-validator';
import { IbexState } from './ibexState';
import { ApiProperty } from '@nestjs/swagger';

export class IbexInvoice {
    @ApiProperty({ description: 'The hash of the invoice', example: 'abcd1234', required: true })
    hash!: string;

    @ApiProperty({ description: 'The bolt11 string of the invoice', example: 'lnbc12345678', required: true })
    bolt11!: string;

    @ApiProperty({ description: 'The pre-image of the invoice', example: '0123456789abcdef', required: true })
    preImage!: string;

    @ApiProperty({ description: 'The memo of the invoice', example: 'Payment for goods', required: true })
    memo!: string;

    @ApiProperty({ description: 'The creation date of the invoice in UTC', example: '2022-01-01T00:00:00Z', required: true })
    creationDateUtc!: string;

    @ApiProperty({ description: 'The expiry date of the invoice in UTC', example: '2022-01-02T00:00:00Z', required: true })
    expiryDateUtc!: string;

    @ApiProperty({ description: 'The settle date of the invoice in UTC', example: '2022-01-02T12:00:00Z', required: true })
    settleDateUtc!: string;

    @ApiProperty({ description: 'The amount in milli-satoshis of the invoice', example: 100000, required: true })
    amountMsat!: number;

    @ApiProperty({ description: 'The received amount in milli-satoshis of the invoice', example: 90000, required: true })
    receiveMsat!: number;

    @ApiProperty({ description: 'The ID of the state', example: 1, required: true })
    stateId!: number;

    @IsOptional()
    @ApiProperty({ description: 'The state of the invoice', example: { id: 1, name: 'Paid' }, required: false })
    state!: IbexState;
}
