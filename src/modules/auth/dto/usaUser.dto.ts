import { IsISO31661Alpha2, IsString } from "class-validator";
import { AuthDto } from "./auth.dto";



export class CreateUsaUserDto extends AuthDto{
    @IsString()
    input: string

    @IsISO31661Alpha2()
    country: string
}