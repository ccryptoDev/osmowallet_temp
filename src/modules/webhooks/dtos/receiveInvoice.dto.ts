import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { IbexLightningTransaction } from '../../ibex/entities/ibexLightningTransaction';

export class LightningInvoiceDto {
    @ApiProperty({
        description: 'The hash of the lightning invoice',
        example: 'abcd1234',
    })
    @IsString()
    @IsOptional()
    hash!: string;

    @ApiProperty({
        description: 'The amount received in millisatoshis',
        example: 100000,
    })
    @IsPositive()
    @IsOptional()
    receivedMsat!: number;

    @ApiProperty({
        description: 'The UTC timestamp when the invoice was settled',
        example: '2022-01-01T00:00:00Z',
    })
    @IsString()
    @IsOptional()
    settledAtUtc!: string;

    @ApiProperty({
        description: 'The webhook secret',
        example: 'secret123',
    })
    @IsString()
    webhookSecret!: string;

    @ApiProperty({
        description: 'The transaction details',
    })
    @IsNotEmpty()
    transaction!: IbexLightningTransaction;
}
