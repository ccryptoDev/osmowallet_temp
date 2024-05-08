import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { SignInDto } from './signin.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AuthOTPDto extends SignInDto {
    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    @ApiProperty({
        description: 'The OTP (One-Time Password)',
        example: 123456,
    })
    otp!: number;
}
