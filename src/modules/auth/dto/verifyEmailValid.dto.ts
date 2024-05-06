import { IsEmail } from "class-validator";

export class VerifyEmailValid {
    @IsEmail()
    email: string
}