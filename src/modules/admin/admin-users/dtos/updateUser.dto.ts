import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsISO31661Alpha2, IsOptional, IsString, Validate, ValidateIf } from 'class-validator';
import { IsNullValue } from 'src/common/decorators/is-null.decorator';
import { IsMobileValid } from 'src/common/dto_validators/mobile.validator';
import { IsValidPassword } from 'src/common/dto_validators/password.validator';

export class UpdateUsersDto {
    @ApiProperty({
        description: 'The email of the user',
        example: 'example@example.com',
    })
    @IsOptional()
    @IsEmail()
    @ValidateIf((o) => o.mobile == undefined)
    email?: string;

    @ApiProperty({
        description: 'The mobile number of the user',
        example: '+1234567890',
    })
    @IsOptional()
    @IsMobileValid({ message: 'Este no es un número de teléfono válido' })
    @ValidateIf((o) => o.email == undefined)
    mobile?: string;

    @ApiProperty({
        description: 'The password of the user',
        example: 'Password123',
    })
    @IsString()
    @IsValidPassword({ message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número' })
    @IsOptional()
    password?: string;

    @ApiProperty({
        description: 'The nationality of the user',
        example: 'US',
    })
    @IsISO31661Alpha2()
    @IsOptional()
    nationality?: string;

    @ApiProperty({
        description: 'The residence of the user',
        example: 'US',
    })
    @IsISO31661Alpha2()
    @IsOptional()
    residence?: string;

    @IsOptional()
    @Validate(IsNullValue)
    pin?: null;
}
