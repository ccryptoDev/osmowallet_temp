import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUsernameDto {
    @ApiProperty({
        description: 'The username',
        example: 'john_doe',
    })
    @IsString()
    username!: string;
}
