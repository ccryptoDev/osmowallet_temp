import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { AccountType } from 'src/modules/send-globally/strike/enums/accountType.enum';

export class BankDataDto {
    @ApiProperty({
        description: 'The account number',
        example: '1234567890',
    })
    @IsString()
    accountNumber!: string;

    @ApiProperty({
        description: "The account holder's name",
        example: 'John Doe',
    })
    @IsNotEmpty()
    accountHolder!: string;

    @ApiProperty({
        description: 'The bank ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    bankId!: string;

    @ApiProperty({
        description: 'The account type',
        example: 'Savings',
        enum: AccountType,
    })
    @IsEnum(AccountType)
    accountType!: AccountType;
}
