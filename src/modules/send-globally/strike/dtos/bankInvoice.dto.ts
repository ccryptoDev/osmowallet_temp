import { IsMongoId } from 'class-validator';
import { StrikeInvoiceDto } from './invoice.dto';
import { ApiProperty } from '@nestjs/swagger';

export class StrikeBankInvoiceDto extends StrikeInvoiceDto {
    @ApiProperty({
        description: 'The payment method ID',
        example: '60f9e3e4a9e6c2001c8e8e7d',
    })
    @IsMongoId()
    paymentMethodId!: string;
}
