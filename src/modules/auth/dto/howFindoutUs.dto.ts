import { IsEmail, IsISO31661Alpha2, IsNotEmpty, IsString, ValidateIf } from "class-validator"
import { IsMobileValid } from "src/common/dto_validators/mobile.validator"
import { AuthDto } from "./auth.dto"

export class HowFindoutUsDto extends AuthDto{

    @IsEmail()
    @ValidateIf(o => o.mobile == undefined)
    email: string

    @ValidateIf(o => o.mobile == undefined)
    mobile: string

    @IsString()
    referralSourceIds: string[]

  }