import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class FundingDto {
    @ApiProperty({
        description: 'The ID of the coin',
        example: 'c7b9a0e1-3e7e-4e0a-8e4e-2e6e4e6e4e6e',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The ID of the funding method',
        example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6',
    })
    @IsUUID()
    fundingMethodId!: string;

    @ApiProperty({
        description: 'The amount of funding',
        example: 100,
    })
    @IsNotEmpty()
    amount!: number;

    @ApiProperty({
        description: 'Additional data',
        example: 'Some additional data',
        required: false,
    })
    @IsString()
    @IsOptional()
    data?: string;

    @ApiProperty({
        description: 'The partner',
        example: 'Some partner',
        required: false,
    })
    @IsString()
    @IsOptional()
    partner?: string;
}
