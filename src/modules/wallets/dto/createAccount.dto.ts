import { IsString } from "class-validator";



export class CreateAccountDto {

    @IsString()
    alias!: string

}