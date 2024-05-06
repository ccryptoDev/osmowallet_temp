import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class SinpeMovilWithdrawDto {
    @IsString()
    @IsNotEmpty()
    phoneNumberTo: string;

    @IsEmail()
    emailTo: string;

    @IsString()
    description: string;
}
