import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumberString, IsString, IsUUID } from 'class-validator';
import { BankAccountType } from 'src/common/enums/bankAccountType.enum';

export class BankAccountDto {
    @ApiProperty({
        description: 'The account number',
        example: '1234567890',
    })
    @IsNumberString()
    accountNumber!: string;

    @ApiProperty({
        description: 'The bank ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    bankId!: string;

    @ApiProperty({
        description: 'The account name',
        example: 'John Doe',
    })
    @IsString()
    accountName!: string;

    @ApiProperty({
        description: 'The coin ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The account type',
        example: 'SAVINGS',
        enum: BankAccountType,
    })
    @IsEnum(BankAccountType)
    accountType!: BankAccountType;
}

export class UpdateBankAccountDTO {
    @ApiProperty({
        description: 'The ID of the bank account to update',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @IsNotEmpty()
    id!: string;
}

export class DeleteBankAccountDTO {
    @ApiProperty({
        description: 'The ID of the bank account to delete',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @IsNotEmpty()
    id!: string;
}
