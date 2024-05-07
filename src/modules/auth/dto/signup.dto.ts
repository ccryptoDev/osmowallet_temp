import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsISO31661Alpha2, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { IsMobileValid } from 'src/common/dto_validators/mobile.validator';
import { AuthDto } from './auth.dto';

export class SignUpDto extends AuthDto {
    @ApiProperty({
        description: 'The email address',
        example: 'example@example.com',
    })
    @IsEmail()
    @ValidateIf((o) => o.mobile == undefined)
    email!: string;

    @ApiProperty({
        description: 'The mobile number',
        example: '1234567890',
    })
    @IsMobileValid({ message: 'Este no es un número de teléfono válido' })
    @ValidateIf((o) => o.email == undefined)
    mobile!: string;

    @ApiProperty({
        description: 'The username',
        example: 'john_doe',
    })
    @IsNotEmpty()
    @IsString()
    username!: string;

    @ApiProperty({
        description: 'The residence country code',
        example: 'US',
    })
    @IsNotEmpty()
    @IsISO31661Alpha2()
    residence!: string;
}
