import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditEmailDto {
    @ApiProperty({
        description: 'The email address',
        example: 'example@example.com',
    })
    @IsEmail()
    email!: string;
}
