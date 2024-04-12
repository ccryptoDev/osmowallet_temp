import { IsEnum,IsNumberString, IsString, IsUUID } from 'class-validator';
import { BankAccountType } from 'src/common/enums/bankAccountType.enum';


export class BankAccountDto{

    @IsNumberString()
    accountNumber: string

    @IsUUID()
    bankId: string

    @IsString()
    accountName: string
    
    @IsUUID()
    coinId: string

    @IsEnum(BankAccountType)
    accountType: BankAccountType
    
}
