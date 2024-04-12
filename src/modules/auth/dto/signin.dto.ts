import { IsEmail, IsISO31661Alpha2, IsMobilePhone, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, ValidateIf } from "class-validator"
import { IsMobileValid } from "src/common/dto_validators/mobile.validator"
import { IsValidPassword } from "src/common/dto_validators/password.validator"
import { AuthDto } from "./auth.dto"
import { GrantType } from "../enums/granTypes.enum";

export class SignInDto extends AuthDto{

    @IsString()
    @IsNotEmpty()
    @ValidateIf(o => o.grantType == GrantType.Password)
    @IsOptional()
    input: string;

  }