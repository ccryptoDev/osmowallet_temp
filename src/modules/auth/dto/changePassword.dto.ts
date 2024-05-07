import { IsNotEmpty, IsString } from 'class-validator';
import { IsValidConfirmPassword, IsValidPassword } from 'src/common/dto_validators/password.validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({ description: 'The current password', example: 'oldPassword' })
    @IsString()
    @IsNotEmpty()
    currentPassword!: string;

    @ApiProperty({ description: 'The new password', example: 'newPassword' })
    @IsValidPassword({ message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número' })
    newPassword!: string;

    @ApiProperty({ description: 'The confirmation of the new password', example: 'newPassword' })
    @IsValidConfirmPassword('newPassword', { message: 'Las contraseñas no coinciden' })
    confirmNewPassword!: string;
}
