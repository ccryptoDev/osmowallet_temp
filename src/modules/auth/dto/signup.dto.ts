import { IsEmail, IsISO31661Alpha2, IsNotEmpty, IsString, ValidateIf } from "class-validator"
import { IsMobileValid } from "src/common/dto_validators/mobile.validator"
import { AuthDto } from "./auth.dto"

export class SignUpDto extends AuthDto{

    @IsEmail()
    @ValidateIf(o => o.mobile == undefined)
    email: string

    @IsMobileValid({message: 'Este no es un número de teléfono válido'})
    @ValidateIf(o => o.email == undefined)
    mobile: string

    @IsNotEmpty()
    @IsString()
    username: string

    @IsNotEmpty()
    @IsISO31661Alpha2()
    residence: string

    @IsString()
    referralSourceIds: string[]

  }