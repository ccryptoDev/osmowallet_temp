import { Transform } from "class-transformer";
import { IsDate, IsNumber, IsPositive, IsUUID } from "class-validator";
import { toDate } from "src/common/transformers/date.transformer";

export class AutoBuyDto{

    @IsPositive()
    @IsNumber()
    amount: number

    @IsUUID()
    coinId: string

    @Transform(({ value }) => toDate(value))
    @IsDate()
    expiry: Date

    @IsPositive()
    @IsNumber()
    targetAmount: number
}