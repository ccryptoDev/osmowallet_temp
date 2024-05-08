import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { IbexLightningTransaction } from './ibexLightningTransaction';
import { ApiProperty } from '@nestjs/swagger';

export class PayLnURLResponse {
    @ApiProperty({
        description: 'The hash value',
        example: 'abc123',
        required: true,
    })
    @IsString()
    hash!: string;

    @ApiProperty({
        description: 'The amount in milli-satoshis',
        example: 100000,
        required: true,
    })
    @IsPositive()
    amountMsat!: number;

    @ApiProperty({
        description: 'The fees in milli-satoshis',
        example: 5000,
        required: true,
    })
    @IsNumber()
    feesMsat!: number;

    @ApiProperty({
        description: 'The UTC timestamp when the payment was settled',
        example: '2022-01-01T12:00:00Z',
        required: false,
    })
    @IsOptional()
    settledAtUtc!: string;

    @ApiProperty({
        description: 'The transaction details',
        example: {
            /* transaction object example */
        },
        required: false,
    })
    @IsOptional()
    transaction!: IbexLightningTransaction;
}
