import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { RelampagoMethod } from '../enums/method.enum';

export class RecipientInfo {
    @ApiProperty({
        description: "The beneficiary's name",
        example: 'John Doe',
    })
    @IsString()
    beneficiary!: string;

    @ApiProperty({
        description: 'The CLABE number',
        example: '012345678901234567',
    })
    @IsString()
    clabe!: string;

    @ApiProperty({
        description: 'The institution name',
        example: 'Bank of America',
    })
    @IsString()
    institutionName!: string;

    @ApiProperty({
        description: 'The institution code',
        example: 'BOFA',
    })
    @IsString()
    institutionCode!: string;

    @ApiProperty({
        description: 'The Relampago method',
        example: 'debitCard',
        enum: RelampagoMethod,
    })
    @IsEnum(RelampagoMethod)
    method!: RelampagoMethod;
}

export class RelampagoQuoteDto {
    @ApiProperty({
        description: 'The number of satoshis',
        example: 100000,
    })
    @IsInt()
    satoshis!: number;

    @ApiProperty({
        description: 'Recipient information',
        example: { beneficiary: 'John Doe', clabe: '012345678901234567', institutionName: 'Bank of America', institutionCode: 'BOFA' },
    })
    @IsNotEmpty()
    recipientInfo: any;
}
