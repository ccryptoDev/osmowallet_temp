import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProfilePictureDto {
    @ApiProperty({
        description: 'The hash of the profile picture',
        example: 'e9a8d7c6b5a4',
    })
    @IsString()
    @IsNotEmpty()
    hash!: string;
}
