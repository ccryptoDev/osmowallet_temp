import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendForgotPasswordDto {
    @ApiProperty({
        description: 'The email address of the user',
        example: 'example@example.com',
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        description: 'The client ID',
        example: '123456789',
    })
    @IsNotEmpty()
    clientId!: string;

    @ApiProperty({
        description: 'The client secret',
        example: 'abcdefg',
    })
    @IsNotEmpty()
    clientSecret!: string;
}
