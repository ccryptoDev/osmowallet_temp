import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFeatureDto {
    @ApiProperty({
        description: 'The maximum value',
        example: 100,
    })
    @IsNumber()
    max!: number;

    @ApiProperty({
        description: 'The minimum value',
        example: 0,
    })
    @IsNumber()
    min!: number;

    @ApiProperty({
        description: 'The fee value',
        example: 10,
    })
    @IsNumber()
    fee!: number;

    @ApiProperty({
        description: 'The daily limit value',
        example: 500,
    })
    @IsNumber()
    dailyLimit!: number;

    @ApiProperty({
        description: 'The monthly limit value',
        example: 10000,
    })
    @IsNumber()
    monthlyLimit!: number;
}
