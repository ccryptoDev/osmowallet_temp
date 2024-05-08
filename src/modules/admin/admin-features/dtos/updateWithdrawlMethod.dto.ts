import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class UpdateWithdrawlMethodDto {
    @ApiProperty({ example: 100, description: 'The maximum value' })
    @IsNumber()
    max!: number;

    @ApiProperty({ example: 10, description: 'The minimum value' })
    @IsNumber()
    min!: number;

    @ApiProperty({ example: 2.5, description: 'The fee value' })
    @IsNumber()
    fee!: number;

    @ApiProperty({ example: '2 days', description: 'The estimated time' })
    @IsString()
    estimateTime!: string;

    @ApiProperty({ example: 'Withdrawal method description', description: 'The description' })
    @IsString()
    description!: string;

    /*
    @ApiProperty({ example: 1000, description: 'The daily limit' })
    @IsNumber()
    dailyLimit!: number;

    @ApiProperty({ example: 30000, description: 'The monthly limit' })
    @IsNumber()
    monthlyLimit!: number;
    */

    @ApiProperty({ example: true, description: 'Indicates if the method is active' })
    @IsBoolean()
    isActive!: boolean;
}
