import { Transform } from "class-transformer"
import { IsDate, IsOptional, IsUUID } from "class-validator"
import { toDate } from "src/common/transformers/date.transformer"


export class CSVTransactionDto {

    @Transform(({ value }) => toDate(value))
    @IsDate()
    toDate: Date

    @Transform(({ value }) => toDate(value))
    @IsDate()
    fromDate: Date

    @IsUUID()
    @IsOptional()
    userId: string
}