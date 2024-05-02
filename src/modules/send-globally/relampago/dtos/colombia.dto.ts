import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ColombiaAccountType } from '../enums/colombiaAccountType.enum';

export class ColombiaQuoteDto {
    @ApiProperty({
        description: 'The document ID',
        example: '1234567890',
    })
    @IsString()
    documentId!: string;

    @ApiProperty({
        description: 'The document type',
        example: 'Checking',
        enum: ColombiaAccountType,
    })
    @IsEnum(ColombiaAccountType)
    documentType!: ColombiaAccountType;

    @ApiProperty({
        description: 'The name',
        example: 'John',
    })
    @IsString()
    name!: string;

    @ApiProperty({
        description: 'The last name',
        example: 'Doe',
    })
    @IsString()
    lastName!: string;

    @ApiProperty({
        description: 'The account type',
        example: 'Savings',
        enum: ColombiaAccountType,
    })
    @IsEnum(ColombiaAccountType)
    accountType!: ColombiaAccountType;

    @ApiProperty({
        description: 'The account number',
        example: '1234567890',
    })
    @IsString()
    accountNumber!: string;

    @ApiProperty({
        description: 'The institution name',
        example: 'Bank of Colombia',
    })
    @IsString()
    institutionName!: string;

    @ApiProperty({
        description: 'The institution code',
        example: '1234',
    })
    @IsString()
    institutionCode!: string;
}
