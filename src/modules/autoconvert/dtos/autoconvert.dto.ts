import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class AutoConvertDto {
    @ApiProperty({
        description: 'The ID of the coin',
        example: 'c7a9e2a0-4a0e-4e9f-8e6a-2e5b3a9b6f1d',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The conversion percentage',
        example: 50,
    })
    @IsPositive()
    percent!: number;

    @ApiProperty({
        description: 'Indicates if the auto conversion is active',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isActive!: boolean;
}
