import { Transform } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';
import { toNumber } from 'src/common/transformers/number.transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty({ description: 'The query string', example: 'example query' })
    @IsOptional()
    query!: string;

    @ApiProperty({ description: 'The phone number', example: '1234567890' })
    @IsOptional()
    phone!: string;

    @ApiProperty({ description: 'The page size', example: 10 })
    @Transform(({ value }) => toNumber(value, { default: 10, min: 1, max: 100 }))
    @IsPositive()
    @IsOptional()
    pageSize: number = 10;

    @ApiProperty({ description: 'The number of items to skip', example: 0 })
    @Transform(({ value }) => toNumber(value, { default: 0, min: 0, max: 100 }))
    @IsOptional()
    skip: number = 0;
}
