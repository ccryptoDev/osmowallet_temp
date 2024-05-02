import { ApiProperty } from '@nestjs/swagger';
import { IbexState } from './ibexState';

class IbexFailureReason {
    @ApiProperty({ description: 'The ID of the failure reason', example: 0, required: true })
    id!: number;

    @ApiProperty({ description: 'The name of the failure reason', example: 'No failure', required: true })
    name!: string;

    @ApiProperty({ description: 'The description of the failure reason', example: 'No failure occurred', required: true })
    description!: string;
}

export class IbexLightningPayment {
    @ApiProperty({ description: 'The bolt11 of the payment', example: 'lnbc1234567890', required: true })
    bolt11!: string;

    @ApiProperty({ description: 'The hash of the payment', example: 'abcdef1234567890', required: true })
    hash!: string;

    @ApiProperty({ description: 'The preImage of the payment', example: '0123456789abcdef', required: true })
    preImage!: string;

    @ApiProperty({ description: 'The memo of the payment', example: 'Payment for goods', required: true })
    memo!: string;

    @ApiProperty({ description: 'The amount in millisatoshis of the payment', example: 100000, required: true })
    amountMsat!: number;

    @ApiProperty({ description: 'The fee in millisatoshis of the payment', example: 1000, required: true })
    feeMsat!: number;

    @ApiProperty({ description: 'The amount paid in millisatoshis of the payment', example: 99000, required: true })
    paidMsat!: number;

    @ApiProperty({ description: 'The creation date of the payment in UTC', example: '2022-01-01T00:00:00Z', required: true })
    creationDateUtc!: string;

    @ApiProperty({ description: 'The settle date of the payment in UTC', example: '2022-01-01T00:01:00Z', required: true })
    settleDateUtc!: string;

    @ApiProperty({ description: 'The status ID of the payment', example: 1, required: true })
    statusId!: number;

    @ApiProperty({ description: 'The failure ID of the payment', example: 0, required: true })
    failureId!: number;

    @ApiProperty({
        description: 'The failure reason of the payment',
        example: { id: 0, name: 'No failure', description: 'No failure occurred' },
        required: true,
    })
    failureReason!: IbexFailureReason;

    @ApiProperty({
        description: 'The status of the payment',
        example: { id: 1, name: 'Pending', description: 'Payment is pending' },
        required: true,
    })
    status!: IbexState;
}
