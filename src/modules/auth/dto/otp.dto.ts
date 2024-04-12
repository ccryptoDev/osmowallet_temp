import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class OtpDto {

  @IsOptional()
  input: string

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  otp: number;
}
