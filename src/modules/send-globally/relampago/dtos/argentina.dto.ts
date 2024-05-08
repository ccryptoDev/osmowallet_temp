import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ArgentinaAccountType } from '../enums/argentinaAccountType.enum';
import { RelampagoCurrency } from '../enums/currency.enum';

export class ArgentinaQuoteDto {
    @ApiProperty({
        description: 'The beneficiary',
        example: 'John Doe',
    })
    @IsString()
    beneficiary!: string;

    @ApiProperty({
        description: 'The currency',
        example: RelampagoCurrency.ARG,
        required: false,
    })
    @IsOptional()
    currency!: RelampagoCurrency;

    @ApiProperty({
        description: 'The account type',
        example: 'CBU',
    })
    @IsEnum(ArgentinaAccountType)
    accountType!: ArgentinaAccountType;

    @ApiProperty({
        description: 'The account number',
        example: '1234567890',
    })
    @IsString()
    accountNumber!: string;

    @ApiProperty({
        description: 'The amount in satoshis',
        example: 100000,
    })
    @IsInt()
    amountSats!: number;
}
