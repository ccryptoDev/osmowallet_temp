import { IsISO31661Alpha2, IsString } from 'class-validator';
import { AuthDto } from './auth.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsaUserDto extends AuthDto {
    @ApiProperty({
        description: 'The input value',
        example: 'example input',
    })
    @IsString()
    input!: string;

    @ApiProperty({
        description: 'The country code',
        example: 'US',
    })
    @IsISO31661Alpha2()
    country!: string;
}
