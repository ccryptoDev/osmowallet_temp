import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { GrantType } from '../enums/granTypes.enum';

export abstract class AuthDto {
    @ApiProperty({
        description: 'The client ID',
        example: '1234567890',
    })
    @IsString()
    @IsNotEmpty()
    clientId!: string;

    @ApiProperty({
        description: 'The client secret',
        example: 'secretpassword',
    })
    @IsString()
    @IsNotEmpty()
    clientSecret!: string;

    @ApiProperty({
        description: 'The grant type',
        example: 'password',
        enum: GrantType,
    })
    @IsEnum(GrantType)
    @IsNotEmpty()
    grantType: GrantType = GrantType.Password;
}
