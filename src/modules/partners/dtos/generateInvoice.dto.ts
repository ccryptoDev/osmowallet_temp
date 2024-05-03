import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PartnerFlow } from '../enums/partnerFlow.enum';
import { BankDataDto } from './bankData.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PartnerGenerateInvoiceDto {
    @ApiProperty({
        description: 'The reference ID of the invoice',
        example: 'INV12345',
    })
    @IsString()
    @IsNotEmpty()
    referenceId!: string;

    @ApiProperty({
        description: 'The phone number associated with the invoice',
        example: '1234567890',
    })
    @IsString()
    @IsNotEmpty()
    phoneNumber!: string;

    @ApiProperty({
        description: 'The amount of the invoice',
        example: 100.5,
    })
    @IsNumber()
    @IsNotEmpty()
    amount!: number;

    @ApiProperty({
        description: 'The description of the invoice',
        example: 'Payment for services',
    })
    @IsString()
    @IsNotEmpty()
    description!: string;

    @ApiProperty({
        description: 'The bank address associated with the invoice',
        example: {
            bankName: 'Example Bank',
            accountNumber: '1234567890',
            routingNumber: '9876543210',
        },
    })
    @Type(() => BankDataDto)
    @IsOptional()
    @ValidateNested()
    bankAddress!: BankDataDto;

    @ApiProperty({
        description: 'The flow type of the invoice',
        example: 'OsmoUserToWallet',
        enum: PartnerFlow,
    })
    @IsEnum(PartnerFlow)
    flowType!: PartnerFlow;
}
