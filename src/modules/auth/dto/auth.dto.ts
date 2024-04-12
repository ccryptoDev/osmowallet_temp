import { IsEnum, IsNotEmpty, IsString } from "class-validator"
import { GrantType } from "../enums/granTypes.enum"


export abstract class AuthDto{
    @IsString()
    @IsNotEmpty()
    clientId: string
    
    @IsString()
    @IsNotEmpty()
    clientSecret: string

    @IsEnum(GrantType)
    @IsNotEmpty()
    grantType: GrantType = GrantType.Password
}