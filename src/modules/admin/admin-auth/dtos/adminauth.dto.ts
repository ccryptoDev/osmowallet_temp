import { IsEnum, IsNotEmpty, IsString, ValidateIf } from "class-validator";
import { GrantType } from "src/modules/auth/enums/granTypes.enum";


export abstract class AdminAuthDto{

    @ValidateIf(o => o.granType == GrantType.Password)
    @IsString()
    email: string;

    @ValidateIf(o => o.granType == GrantType.Password)
    @IsString()
    password: string

    @IsNotEmpty()
    clientId: string
  
    @IsNotEmpty()
    clientSecret: string

    @IsEnum(GrantType)
    @IsNotEmpty()
    grantType: GrantType = GrantType.Password
}