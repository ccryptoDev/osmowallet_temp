import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class StrikeInvoiceDto {
    @ApiProperty({ description: 'The description of the invoice', example: 'Invoice for services rendered' })
    @IsString()
    @IsOptional()
    description: string = '';

    @ApiProperty({ description: 'The amount of the invoice', example: 100 })
    @IsNumber()
    amount!: number;
}
