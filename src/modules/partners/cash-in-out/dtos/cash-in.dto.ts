import { IsEmail, IsNumber, IsOptional } from "class-validator";
import { IsMobilePhoneWithoutPlus } from "../../dtos/getUser.dto";


export class CashInDto {
    @IsOptional()
    @IsMobilePhoneWithoutPlus()
    phoneNumber?: string;
  
    @IsEmail()
    @IsOptional()
    email?: string;

    @IsNumber()
    amount: number
}
