import { Transform } from "class-transformer"
import { IsBoolean, IsDate, IsOptional, IsPositive, IsUUID } from "class-validator"
import { toDate } from "src/common/transformers/date.transformer"


export class AutoConvertDto{
    
    @IsUUID()
    coinId: string

    @IsPositive()
    percent: number

    @IsBoolean()
    @IsOptional()
    isActive: boolean
}