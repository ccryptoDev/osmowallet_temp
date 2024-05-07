import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
    @ApiProperty({
        description: 'The value of the setting',
        example: 'example value',
    })
    @IsString()
    value!: string;
}
