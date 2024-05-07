import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { toNumber } from 'src/common/transformers/number.transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetOsmoBusinessDto {
    @ApiProperty({
        description: 'The page number',
        example: 1,
    })
    @Transform(({ value }) => toNumber(value, { default: 1, min: 1, max: 100 }))
    @IsOptional()
    page: number = 1;

    @ApiProperty({
        description: 'The query string',
        example: 'example query',
    })
    @IsString()
    @IsOptional()
    @Transform(({ value }) => value.toLowerCase())
    query!: string;
}
