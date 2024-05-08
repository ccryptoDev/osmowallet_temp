import { IsString } from "class-validator";



export class CreateAccountDto {
    @IsString()
    user_id!: string
    
    @IsString()
    alias!: string

}