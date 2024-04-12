import { Transform } from "class-transformer"
import { IsDate, IsEnum, IsOptional, IsUUID, ValidateIf } from "class-validator"
import { toDate } from "src/common/transformers/date.transformer"
import { TransactionMetricPeriod } from "../../admin-users/enums/period.enum"


export class GetTransactionsMetricsDto {

    @IsUUID()
    coinId: string

    @IsEnum(TransactionMetricPeriod)
    @IsOptional()
    period: TransactionMetricPeriod

    @IsOptional()
    @IsDate()
    @Transform(({ value }) => toDate(value))
    @ValidateIf(o => o.period === TransactionMetricPeriod.CUSTOM)
    fromDate: Date

    @IsOptional()
    @IsDate()
    @Transform(({ value }) => toDate(value))
    @ValidateIf(o => o.period === TransactionMetricPeriod.CUSTOM)
    toDate: Date
    
}