import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { AdminTransactionType } from '../enums/adminTransactionType.enum';

export class CreateAdminTransactionDto {
    @ApiProperty({
        enum: AdminTransactionType,
        description: 'The type of the admin transaction',
        example: 'OSMO_CREDIT',
    })
    type!: AdminTransactionType;

    @ApiProperty({
        description: 'The data of the admin transaction',
        example: {},
    })
    @IsObject()
    data: any;
}

export class OsmoCreditDto {
    @ApiProperty({
        description: 'The amount of the credit',
        example: 100,
    })
    @IsPositive()
    @IsNumber()
    amount!: number;

    @ApiProperty({
        description: 'The user ID',
        example: '12345678-1234-1234-1234-123456789abc',
    })
    @IsUUID()
    userId!: string;

    @ApiProperty({
        description: 'The coin ID',
        example: '12345678-1234-1234-1234-123456789abc',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The note (optional)',
        example: 'This is a note',
    })
    @IsString()
    @IsOptional()
    note?: string;

    @ApiProperty({
        description: 'The display flag',
        example: true,
    })
    @IsBoolean()
    display!: boolean;
}

export class OsmoDebitDto {
    @ApiProperty({
        description: 'The amount of the debit',
        example: 100,
    })
    @IsPositive()
    @IsNumber()
    amount!: number;

    @ApiProperty({
        description: 'The user ID',
        example: '12345678-1234-1234-1234-123456789abc',
    })
    @IsUUID()
    userId!: string;

    @ApiProperty({
        description: 'The coin ID',
        example: '12345678-1234-1234-1234-123456789abc',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The note (optional)',
        example: 'This is a note',
    })
    @IsString()
    @IsOptional()
    note?: string;

    @ApiProperty({
        description: 'The display flag',
        example: true,
    })
    @IsBoolean()
    display!: boolean;
}

export class CreditBtcOsmoBusinessDto {
    @ApiProperty({
        description: 'The amount of the credit',
        example: 100,
    })
    @IsNumber()
    amount!: number;

    @ApiProperty({
        description: 'The user ID',
        example: '12345678-1234-1234-1234-123456789abc',
    })
    @IsUUID()
    userId!: string;
}
