import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SinpeMovilWithdrawDto {
    @ApiProperty({
        description: 'The phone number to withdraw to',
        example: '88888851',
    })
    @IsString()
    @IsNotEmpty()
    phoneNumber!: string;
}
