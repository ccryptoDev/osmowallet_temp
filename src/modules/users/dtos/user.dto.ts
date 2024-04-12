import { Transform } from "class-transformer";
import { IsOptional, IsPositive } from "class-validator";
import { toNumber } from "src/common/transformers/number.transformer";


export class UserDto{
    
    @IsOptional()
    query: string

    @IsOptional()
    phone: string

    @Transform(({ value }) => toNumber(value, { default: 10, min: 1}))
    @IsPositive()
    @IsOptional()
    pageSize: number = 10

    @Transform(({ value }) => toNumber(value, { default: 0, min: 0,}))
    @IsOptional()
    skip: number = 0
}