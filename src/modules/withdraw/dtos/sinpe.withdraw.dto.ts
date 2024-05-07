import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SinpeWithdrawDto {
    @ApiProperty({
        description: 'The IBAN of the recipient',
        example: 'CR1234567890123456789',
    })
    @IsString()
    iban!: string;
}
