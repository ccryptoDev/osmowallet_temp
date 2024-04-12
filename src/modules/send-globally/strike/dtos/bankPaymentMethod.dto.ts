import { Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { TransferType } from "../enums/transferType.enum";
import { AccountType } from "../enums/accountType.enum";
import { BeneficiaryType } from "../enums/beneficiaryType.enum";

export class BankAddress {
    @IsNotEmpty()
    @IsString()
    public country: string;

    @IsString()
    @IsOptional()
    public state: string;

    @IsString()
    public city: string;

    @IsNotEmpty()
    @IsString()
    public postCode: string;

    @IsNotEmpty()
    @IsString()
    public line1: string;
}

export class StrikeBankPaymentMethodDto {
    
    @IsEnum(TransferType)
    public transferType: TransferType;

    @IsNotEmpty()
    @IsString()
    public accountNumber: string;

    @IsNotEmpty()
    @IsString()
    public routingNumber: string;

    @IsEnum(AccountType)
    public accountType: AccountType;

    @IsNotEmpty()
    @IsString()
    public bankName: string;

    @IsNotEmpty()
    @Type(() => BankAddress)
    public bankAddress: BankAddress;

    @IsNotEmpty()
    @Type(() => Beneficiary)
    public beneficiaries: Beneficiary[];
}



export class Beneficiary {

    @IsEnum(BeneficiaryType)
    public type: BeneficiaryType;

    @IsNotEmpty()
    @IsString()
    public name: string;

    @IsNotEmpty()
    @Type(() => BankAddress)
    public address: BankAddress;

    @IsOptional()
    @IsString()
    public email: string;

    @IsOptional()
    @IsString()
    public phoneNumber: string;

    @IsOptional()
    @IsString()
    public url: string;
}


