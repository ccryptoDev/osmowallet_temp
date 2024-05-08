import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIP, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Platform } from 'src/common/enums/platform.enum';

export class SessionDto {
    @ApiProperty({
        description: 'The location of the session',
        example: 'New York',
    })
    @IsNotEmpty()
    location!: string;

    @ApiProperty({
        description: 'The IP address of the session',
        example: '192.168.0.1',
    })
    @IsIP()
    ip: any;

    @ApiProperty({
        description: 'The device used for the session',
        example: 'iPhone X',
    })
    @IsString()
    device!: string;

    @ApiProperty({
        description: 'The platform of the session',
        example: 'ANDROID',
        enum: Platform,
    })
    @IsEnum(Platform)
    platform!: Platform;

    @ApiProperty({
        description: 'The session token',
        example: 'abc123',
        required: false,
    })
    @IsString()
    @IsOptional()
    token!: string;
}
