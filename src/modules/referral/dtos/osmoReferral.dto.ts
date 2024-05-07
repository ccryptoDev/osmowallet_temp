import { ApiProperty } from '@nestjs/swagger';
import { IsMobileValid } from 'src/common/dto_validators/mobile.validator';

export class OsmoReferralDto {
    @ApiProperty({
        description: 'The phone number',
        example: '1234567890',
    })
    @IsMobileValid({ message: 'Este no es un número de teléfono válido' })
    phoneNumber!: string;
}
