import { ApiProperty } from '@nestjs/swagger';
import { IsMobileValid } from 'src/common/dto_validators/mobile.validator';

export class EditMobileDto {
    @ApiProperty({
        description: 'The mobile number',
        example: '1234567890',
    })
    @IsMobileValid({ message: 'Este no es un número de teléfono válido' })
    mobile!: string;
}
