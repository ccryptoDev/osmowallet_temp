import { Transform } from 'class-transformer';
import { IsBooleanString, IsDate, IsISO31661Alpha2, IsOptional, IsString } from 'class-validator';
import { toDate } from 'date-fns/toDate';
import { toNumber } from 'src/common/transformers/number.transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetUsersDto {
    @ApiProperty({ description: 'The query string for searching users', example: 'John Doe' })
    @IsString()
    @IsOptional()
    query!: string;

    @ApiProperty({ description: 'The page number for pagination', example: 1 })
    @Transform(({ value }) => (typeof value === 'string' ? toNumber(value, { default: 0, min: 0, max: 100 }) : 0))
    @IsOptional()
    page: number = 0;
}

export class GetUserCSVDTO {
    @ApiProperty({ description: 'The starting date for filtering users', example: '2022-01-01' })
    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    fromDate?: Date;

    @ApiProperty({ description: 'The ending date for filtering users', example: '2022-12-31' })
    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    toDate?: Date;

    @ApiProperty({ description: 'Flag indicating if the user is active', example: true })
    @IsBooleanString()
    @IsOptional()
    isActive!: boolean;

    @ApiProperty({ description: "Flag indicating if the user's email is verified", example: true })
    @IsBooleanString()
    @IsOptional()
    isEmailVerified!: boolean;

    @ApiProperty({ description: "Flag indicating if the user's phone is verified", example: true })
    @IsBooleanString()
    @IsOptional()
    isPhoneVerified!: boolean;

    @ApiProperty({ description: "Flag indicating if the user's KYC is verified", example: true })
    @IsBooleanString()
    @IsOptional()
    isKycVerified!: boolean;

    @ApiProperty({ description: 'The residence country code of the user', example: 'US' })
    @IsISO31661Alpha2()
    @IsOptional()
    residence!: string;

    @ApiProperty({ description: 'The nationality country code of the user', example: 'GB' })
    @IsISO31661Alpha2()
    @IsOptional()
    nationality!: string;
}
