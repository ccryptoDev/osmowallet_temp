import { IsString } from 'class-validator';
import { AuthDto } from './auth.dto';
import { ApiProperty } from '@nestjs/swagger';

export class InputDto extends AuthDto {
    @ApiProperty({
        description: 'The input value',
        example: 'example input',
    })
    @IsString()
    input!: string;
}
