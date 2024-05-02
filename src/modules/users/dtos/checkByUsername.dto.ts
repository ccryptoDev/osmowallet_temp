import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckUserByUsername {
    @ApiProperty({
        description: 'The username of the user',
        example: 'john_doe',
    })
    @IsString()
    username!: string;
}
