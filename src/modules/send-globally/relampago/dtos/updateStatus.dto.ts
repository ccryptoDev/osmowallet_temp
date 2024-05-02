import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRelampagoInvoiceDto {
    @ApiProperty({
        description: 'The event',
        example: 'payment_received',
    })
    @IsString()
    event!: string;

    @ApiProperty({
        description: 'The transaction ID',
        example: '123456789',
    })
    @IsString()
    txId!: string;
}
