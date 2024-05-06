import { IsString } from "class-validator";


export class CheckUserByUsername{
    
    @IsString()
    username: string
}