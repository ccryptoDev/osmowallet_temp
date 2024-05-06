import { Transform } from 'class-transformer';
import { IsDate, IsInt } from 'class-validator';
import { toDate } from 'src/common/transformers/date.transformer';

export class ValidateTransactionsBodyDto {
    @IsInt({ each: true })
    file: number[];
}

export class ValidateTransactionsQueryDto {
    @IsDate()
    @Transform(({ value }) => toDate(value))
    fromDate: Date;

    @IsDate()
    @Transform(({ value }) => toDate(value))
    toDate: Date;
}
