import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { toNumber } from 'src/common/transformers/number.transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetCommerceDto {
    @ApiProperty({ description: 'The query string', example: 'example query' })
    @IsOptional()
    query!: string;

    @ApiProperty({ description: 'The page number', example: 1 })
    @Min(1)
    @IsInt()
    @Transform(({ value }) => toNumber(value, { default: 0, min: 1, max: 100 }))
    @IsOptional()
    page = 1;
}
