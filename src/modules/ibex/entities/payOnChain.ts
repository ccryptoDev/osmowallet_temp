import { ApiProperty } from '@nestjs/swagger';

export class PayOnChainResponse {
    @ApiProperty({
        description: 'The transaction ID',
        example: '1234567890',
        required: true,
    })
    transactionId!: string;

    @ApiProperty({
        description: 'The amount in satoshis',
        example: 100000,
        required: true,
    })
    amountSat!: number;

    @ApiProperty({
        description: 'The fee in satoshis',
        example: 5000,
        required: true,
    })
    feeSat!: number;

    @ApiProperty({
        description: 'The status of the transaction',
        example: 'completed',
        required: true,
    })
    status!: string;
}
