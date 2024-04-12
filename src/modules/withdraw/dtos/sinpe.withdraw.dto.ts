import { IsEmail, IsIBAN } from "class-validator";


import { IsString } from "class-validator";

export class SinpeWithdrawDto {

    @IsIBAN()
    ibanTo: string

    @IsString()
    nameTo: string

    @IsEmail()
    emailTo: string

    @IsString()
    documentTo: string

    @IsString()
    documentTypeTo: string

    @IsString()
    description: string = ''
}
