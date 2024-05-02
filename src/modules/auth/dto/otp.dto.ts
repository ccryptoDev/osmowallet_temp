import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OtpDto {
    @ApiProperty({ description: 'The input value', example: 'example input' })
    @IsOptional()
    input!: string;

    @ApiProperty({ description: 'The OTP value', example: 123456 })
    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    otp!: number;
}
