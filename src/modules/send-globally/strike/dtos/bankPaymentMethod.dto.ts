import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../enums/accountType.enum';
import { BeneficiaryType } from '../enums/beneficiaryType.enum';
import { TransferType } from '../enums/transferType.enum';

export class BankAddress {
    @ApiProperty({ description: 'The country', example: 'USA' })
    @IsNotEmpty()
    @IsString()
    public country!: string;

    @ApiProperty({ description: 'The state', example: 'California', required: false })
    @IsString()
    @IsOptional()
    public state!: string;

    @ApiProperty({ description: 'The city', example: 'Los Angeles' })
    @IsString()
    public city!: string;

    @ApiProperty({ description: 'The postal code', example: '12345' })
    @IsNotEmpty()
    @IsString()
    public postCode!: string;

    @ApiProperty({ description: 'The address line 1', example: '123 Main St' })
    @IsNotEmpty()
    @IsString()
    public line1!: string;
}

export class StrikeBankPaymentMethodDto {
    @ApiProperty({ description: 'The transfer type', example: 'ACH', enum: TransferType })
    @IsEnum(TransferType)
    public transferType!: TransferType;

    @ApiProperty({ description: 'The account number', example: '1234567890' })
    @IsNotEmpty()
    @IsString()
    public accountNumber!: string;

    @ApiProperty({ description: 'The routing number', example: '987654321' })
    @IsNotEmpty()
    @IsString()
    public routingNumber!: string;

    @ApiProperty({ description: 'The account type', example: 'CHECKING', enum: AccountType })
    @IsEnum(AccountType)
    public accountType!: AccountType;

    @ApiProperty({ description: 'The bank name', example: 'ABC Bank' })
    @IsNotEmpty()
    @IsString()
    public bankName!: string;

    @ApiProperty({ description: 'The bank address' })
    @IsNotEmpty()
    @Type(() => BankAddress)
    public bankAddress!: BankAddress;

    @ApiProperty({ description: 'The beneficiaries', example: 'INDIVIDUAL', enum: BeneficiaryType })
    @IsNotEmpty()
    @Type(() => Beneficiary)
    public beneficiaries!: Beneficiary[];
}

export class Beneficiary {
    @ApiProperty({ description: 'The beneficiary type', example: 'INDIVIDUAL', enum: BeneficiaryType })
    @IsEnum(BeneficiaryType)
    public type!: BeneficiaryType;

    @ApiProperty({ description: 'The beneficiary name', example: 'John Doe' })
    @IsNotEmpty()
    @IsString()
    public name!: string;

    @ApiProperty({ description: 'The beneficiary address' })
    @IsNotEmpty()
    @Type(() => BankAddress)
    public address!: BankAddress;

    @ApiProperty({ description: 'The beneficiary email', example: 'john.doe@example.com', required: false })
    @IsOptional()
    @IsString()
    public email!: string;

    @ApiProperty({ description: 'The beneficiary phone number', example: '+1234567890', required: false })
    @IsOptional()
    @IsString()
    public phoneNumber!: string;

    @ApiProperty({ description: 'The beneficiary URL', example: 'https://example.com', required: false })
    @IsOptional()
    @IsString()
    public url!: string;
}
