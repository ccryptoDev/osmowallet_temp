import { IsString } from 'class-validator';
import { StrikeInvoiceDto } from './invoice.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStrikeUserInvoiceDto extends StrikeInvoiceDto {
    @ApiProperty({
        description: 'The username of the user',
        example: 'john_doe',
    })
    @IsString()
    @ApiProperty()
    username!: string;
}
