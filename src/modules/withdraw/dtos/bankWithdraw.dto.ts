import { IsNotEmptyObject, IsNumber, IsUUID } from "class-validator";
import { BankAccount } from "src/entities/bank.account.entity";


export class BankWithdrawDto{
    
    @IsUUID()
    bankAccountId: string
}