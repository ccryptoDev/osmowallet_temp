import { IsString } from "class-validator";
import { AuthDto } from "./auth.dto";


export class InputDto extends AuthDto{

    @IsString()
    input: string
}