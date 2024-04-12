import { IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator"
import { AccountType } from "src/modules/send-globally/strike/enums/accountType.enum"

export class BankDataDto {

    @IsString()
    accountNumber: string

    @IsNotEmpty()
    accountHolder: string

    @IsUUID()
    @IsNotEmpty()
    bankId: string

    @IsEnum(AccountType)
    accountType: AccountType
}