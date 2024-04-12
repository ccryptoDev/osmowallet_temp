import { IsEmail, IsISO31661Alpha2, IsOptional, IsString, Validate, ValidateIf } from 'class-validator';
import { IsNullValue } from 'src/common/decorators/is-null.decorator';
import { IsMobileValid } from 'src/common/dto_validators/mobile.validator';
import { IsValidPassword } from 'src/common/dto_validators/password.validator';

export class UpdateUsersDto {
    @IsOptional()
    @IsEmail()
    @ValidateIf((o) => o.mobile == undefined)
    email?: string;

    @IsOptional()
    @IsMobileValid({ message: 'Este no es un número de teléfono válido' })
    @ValidateIf((o) => o.email == undefined)
    mobile?: string;

    @IsString()
    @IsValidPassword({ message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número' })
    @IsOptional()
    password?: string;

    @IsISO31661Alpha2()
    @IsOptional()
    nationality?: string;

    @IsISO31661Alpha2()
    @IsOptional()
    residence?: string;

    @IsOptional()
    @Validate(IsNullValue)
    pin?: null
}
