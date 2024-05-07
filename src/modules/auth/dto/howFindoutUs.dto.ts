import { IsEmail, IsArray, ValidateIf } from "class-validator"
import { IsMobileValid } from "src/common/dto_validators/mobile.validator"
import { AuthDto } from "./auth.dto"

export class HowFindoutUsDto extends AuthDto {
  @IsEmail()
  @ValidateIf(o => o.mobile == undefined)
  email!: string

  @ValidateIf(o => o.email == undefined)
  mobile!: string

  @IsArray()
  referralSourceIds!: string[]

}