import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class WithdrawDto {
    @ApiProperty({
        description: 'The amount to withdraw',
        example: 100,
    })
    @IsNumber()
    amount!: number;

    @ApiProperty({
        description: 'The ID of the coin',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The ID of the withdraw method',
        example: 'withdrawMethodId',
    })
    @IsString()
    withdrawMethodId!: string;

    @ApiProperty({
        description: 'Additional data for the withdrawal',
        example: 'data',
    })
    @IsString()
    data!: string;

    @ApiProperty({
        description: 'The partner associated with the withdrawal (optional)',
        example: 'partner',
        required: false,
    })
    @IsString()
    @IsOptional()
    partner?: string;
}
