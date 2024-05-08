import { IsEmail, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { IsMobilePhoneWithoutPlus } from '../../dtos/getUser.dto';

export class Data {
    @IsNumber()
    token!: number;
}

export class CashOutDto {
    @IsMobilePhoneWithoutPlus()
    @IsOptional()
    phoneNumber!: string;

    @IsEmail()
    @IsOptional()
    email!: string;

    @IsNumber()
    amount!: number;

    @ValidateNested()
    data!: Data;
}
