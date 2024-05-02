import { IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminStableDto {
    @ApiProperty({
        description: 'The user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    userId!: string;

    @ApiProperty({
        description: 'The coin ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The amount',
        example: 100,
    })
    @IsNumber()
    amount!: number;
}
