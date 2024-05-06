import { IsDate, IsEnum, IsOptional, IsUUID, ValidateIf } from "class-validator";
import { TransactionMetricPeriod } from "../enums/period.enum";
import { Transform } from "class-transformer";
import { toDate } from "src/common/transformers/date.transformer";



export class TransactionMetricDto {

    @IsUUID()
    @IsOptional()
    userId: string

    @IsUUID()
    coinId: string

    @IsEnum(TransactionMetricPeriod)
    period: TransactionMetricPeriod

    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    @ValidateIf(o => o.period === TransactionMetricPeriod.CUSTOM)
    fromDate: Date


    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    @ValidateIf(o => o.period === TransactionMetricPeriod.CUSTOM)
    toDate: Date
}