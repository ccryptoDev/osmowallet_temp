import { ApiProperty } from '@nestjs/swagger';
import { IsValidConfirmPassword, IsValidPassword } from 'src/common/dto_validators/password.validator';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'The new password',
        example: 'Password123',
    })
    @IsValidPassword({ message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número' })
    newPassword!: string;

    @ApiProperty({
        description: 'The confirmation of the new password',
        example: 'Password123',
    })
    @IsValidConfirmPassword('newPassword', { message: 'Las contraseñas no coinciden' })
    confirmNewPassword!: string;
}
