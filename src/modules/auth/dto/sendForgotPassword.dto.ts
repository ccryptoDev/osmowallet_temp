import { IsEmail, IsNotEmpty } from 'class-validator';
import { AuthDto } from './auth.dto';


export class SendForgotPasswordDto{

    @IsEmail()
    email: string

    @IsNotEmpty()
    clientId: string
  
    @IsNotEmpty()
    clientSecret: string
}   