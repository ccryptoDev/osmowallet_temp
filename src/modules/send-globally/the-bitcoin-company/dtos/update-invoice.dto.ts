import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateInvoiceDTO {
    @ApiProperty({
        description: 'The ID of the invoice',
        example: '123456789',
    })
    @IsString()
    id!: string;

    @ApiProperty({
        description: 'The PR of the invoice',
        example: 'PR123',
    })
    @IsString()
    pr!: string;
}
