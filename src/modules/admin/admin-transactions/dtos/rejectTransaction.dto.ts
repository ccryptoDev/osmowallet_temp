import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectTransactionDto {
    @ApiProperty({
        description: 'The note for rejecting the transaction',
        example: 'Transaction rejected due to insufficient funds',
    })
    @IsString()
    @IsOptional()
    note!: string;
}
