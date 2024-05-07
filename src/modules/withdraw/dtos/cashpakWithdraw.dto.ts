import { IsNumber, IsPositive, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CashpakWithdrawDto {
    @ApiProperty({
        description: 'The amount to withdraw',
        example: 100,
    })
    @IsPositive()
    @IsNumber()
    amount!: number;

    @ApiProperty({
        description: 'The ID of the coin',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    coinId!: string;
}
