import { Transform } from 'class-transformer';
import { IsBooleanString, IsDate, IsISO31661Alpha2, IsOptional, IsString } from 'class-validator';
import { toDate } from 'date-fns/toDate';
import { toNumber } from 'src/common/transformers/number.transformer';

export class GetUsersDto {
    @IsString()
    @IsOptional()
    query: string;

    @Transform(({ value }) => (typeof value === 'string' ? toNumber(value, { default: 0, min: 0 }) : 0))
    @IsOptional()
    page: number = 0;
}

export class GetUserCSVDTO {
    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    fromDate?: Date;

    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    toDate?: Date;

    @IsBooleanString()
    @IsOptional()
    isActive: boolean;

    @IsBooleanString()
    @IsOptional()
    isEmailVerified: boolean;

    @IsBooleanString()
    @IsOptional()
    isPhoneVerified: boolean;

    @IsBooleanString()
    @IsOptional()
    isKycVerified: boolean;

    @IsISO31661Alpha2()
    @IsOptional()
    residence: string;

    @IsISO31661Alpha2()
    @IsOptional()
    nationality: string;
}
