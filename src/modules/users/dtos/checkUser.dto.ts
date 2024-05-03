import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class CheckUserDto {
    @ApiProperty({
        description: 'Array of phone numbers',
        example: ['1234567890'],
    })
    @IsArray()
    @IsNotEmpty()
    phones!: string[];
}
