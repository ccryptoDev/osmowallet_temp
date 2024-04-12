import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsObject,
    IsOptional,
    IsPositive,
    IsString,
    IsUUID
} from 'class-validator';
import { AdminTransactionType } from '../enums/adminTransactionType.enum';

export class CreateAdminTransactionDto {
    @IsEnum(AdminTransactionType)
    type: AdminTransactionType;

    @IsObject()
    data: any;
}

export class OsmoCreditDto {
    @IsPositive()
    @IsNumber()
    amount: number;

    @IsUUID()
    userId: string;

    @IsUUID()
    coinId: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsBoolean()
    display: boolean;
}

export class OsmoDebitDto {
    @IsPositive()
    @IsNumber()
    amount: number;

    @IsUUID()
    userId: string;

    @IsUUID()
    coinId: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsBoolean()
    display: boolean;
}

export class CreditBtcOsmoBusinessDto {
    @IsNumber()
    amount: number;

    @IsUUID()
    userId: string;
}
