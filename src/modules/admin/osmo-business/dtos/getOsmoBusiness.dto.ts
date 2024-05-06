import { Transform } from "class-transformer"
import { IsOptional, IsString } from "class-validator"
import { toNumber } from "src/common/transformers/number.transformer"


export class GetOsmoBusinessDto {

    @Transform(({ value }) => toNumber(value, { default: 1, min:1,}))
    @IsOptional()
    page: number = 1

    @IsString()
    @IsOptional()
    @Transform(({ value }) => value.toLowerCase())
    query: string
}