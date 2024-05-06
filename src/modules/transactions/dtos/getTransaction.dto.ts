import { Transform } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionMethodEnum } from 'src/common/enums/transactionMethod.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { toDate } from 'src/common/transformers/date.transformer';
import { toNumber } from 'src/common/transformers/number.transformer';

export class GetTransactionsDto {
    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    fromDate?: Date;

    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    toDate?: Date;

    @IsEnum(TransactionType, { each: true })
    @IsArray()
    @Transform(({ value }) =>
        value
            .trim()
            .split(',')
            .map((type) => TransactionType[type]),
    )
    types: TransactionType[];

    @IsString()
    @IsOptional()
    query?: string;

    @Transform(({ value }) => toNumber(value, { default: 0, min: 0 }))
    @IsOptional()
    page?: number = 0;

    @IsEnum(Status)
    @IsOptional()
    status?: Status;

    @IsUUID()
    @IsOptional()
    coinId?: string;

    @IsOptional()
    fromAmount?: number;

    @IsOptional()
    toAmount?: number;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsEnum(TransactionMethodEnum)
    @IsOptional()
    method?: TransactionMethodEnum;
    @IsUUID()
    @IsOptional()
    userId?: string;

    @IsEnum(Partner)
    @IsOptional()
    partner?: Partner;
}
