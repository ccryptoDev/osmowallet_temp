import { Transform } from "class-transformer"
import { IsNumber, IsString } from "class-validator"
import { AuthDto } from "./auth.dto"
import { SignInDto } from "./signin.dto"


export class AuthOTPDto extends SignInDto{

    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    otp: number
}