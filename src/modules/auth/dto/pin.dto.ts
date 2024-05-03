import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PinDto {
    @ApiProperty({
        description: 'The PIN',
        example: '1234',
    })
    @IsString()
    pin!: string;
}
