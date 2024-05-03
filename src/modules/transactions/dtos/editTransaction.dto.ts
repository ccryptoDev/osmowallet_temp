import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class EditTransactionDto {
    @ApiProperty({ description: 'The category ID', example: '12345678-1234-1234-1234-1234567890ab' })
    @IsUUID()
    @IsOptional()
    categoryId!: string;

    @ApiProperty({ description: 'The note', example: 'This is a transaction note' })
    @IsString()
    @IsOptional()
    note!: string;
}
