import { Transform } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionMethodEnum } from 'src/common/enums/transactionMethod.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { toDate } from 'src/common/transformers/date.transformer';
import { toNumber } from 'src/common/transformers/number.transformer';

export class GetTransactionsDto {
    @ApiProperty({
        description: 'The starting date for filtering transactions',
        example: '2022-01-01',
    })
    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    fromDate?: Date;

    @ApiProperty({
        description: 'The ending date for filtering transactions',
        example: '2022-12-31',
    })
    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    toDate?: Date;

    @ApiProperty({
        description: 'The types of transactions to include',
        example: ['Type1', 'Type2'],
    })
    @IsEnum(TransactionType, { each: true })
    @IsArray()
    @Transform(({ value }) =>
        value
            .trim()
            .split(',')
            .map((type: TransactionType) => TransactionType[type]),
    )
    types!: TransactionType[];

    @ApiProperty({
        description: 'The query string for searching transactions',
        example: 'search query',
    })
    @IsString()
    @IsOptional()
    query?: string;

    @ApiProperty({
        description: 'The page number for pagination',
        example: 1,
    })
    @Transform(({ value }) => toNumber(value, { default: 0, min: 0, max: 100 }))
    @IsOptional()
    page?: number = 0;

    @ApiProperty({
        description: 'The status of transactions',
        example: 'Pending',
    })
    @IsEnum(Status)
    @IsOptional()
    status?: Status;

    @ApiProperty({
        description: 'The ID of the coin',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsOptional()
    coinId?: string;

    @ApiProperty({
        description: 'The minimum amount for filtering transactions',
        example: 10.5,
    })
    @IsOptional()
    fromAmount?: number;

    @ApiProperty({
        description: 'The maximum amount for filtering transactions',
        example: 100.0,
    })
    @IsOptional()
    toAmount?: number;

    @ApiProperty({
        description: 'The ID of the category',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @ApiProperty({
        description: 'The method of transaction',
        example: 'Credit Card',
    })
    @IsEnum(TransactionMethodEnum)
    @IsOptional()
    method?: TransactionMethodEnum;

    @ApiProperty({
        description: 'The ID of the user',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsOptional()
    userId?: string;

    @ApiProperty({
        description: 'The partner of the transaction',
        example: 'Partner1',
    })
    @IsEnum(Partner)
    @IsOptional()
    partner?: Partner;
}
