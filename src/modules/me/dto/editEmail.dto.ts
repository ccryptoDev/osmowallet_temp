import { IsEmail } from "class-validator";


export class EditEmailDto {

    @IsEmail()
    email: string
}