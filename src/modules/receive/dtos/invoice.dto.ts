import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class InvoiceDto {
    @ApiProperty({
        description: 'The amount in satoshis',
        example: 100000,
    })
    @IsNumber()
    amountSats!: number;

    @ApiProperty({
        description: 'The price of BTC',
        example: 50000,
    })
    @IsNumber()
    btcPrice!: number;
}

export class InvoiceDtoV2 {
    @ApiProperty({
        description: 'The amount in satoshis',
        example: 100000,
    })
    @IsNumber()
    amountSats!: number;

    @ApiProperty({
        description: 'The rocket object',
        example: { name: 'Falcon 9', type: 'Reusable' },
    })
    @IsNotEmpty()
    rocket: any;

    @ApiProperty({
        description: 'The price of BTC',
        example: 50000,
        required: false,
    })
    btcPrice?: number;
}
