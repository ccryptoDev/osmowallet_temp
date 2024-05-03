import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { GrantType } from 'src/modules/auth/enums/granTypes.enum';

export abstract class AdminAuthDto {
    @ApiProperty({
        description: 'The email of the admin',
        example: 'admin@example.com',
    })
    @ValidateIf((o) => o.grantType == GrantType.Password)
    @IsString()
    email!: string;

    @ApiProperty({
        description: 'The password of the admin',
        example: 'password123',
    })
    @ValidateIf((o) => o.grantType == GrantType.Password)
    @IsString()
    password!: string;

    @ApiProperty({
        description: 'The client ID',
        example: 'client123',
    })
    @IsNotEmpty()
    clientId!: string;

    @ApiProperty({
        description: 'The client secret',
        example: 'secret123',
    })
    @IsNotEmpty()
    clientSecret!: string;

    @ApiProperty({
        description: 'The grant type',
        example: GrantType.Password,
        enum: GrantType,
    })
    @IsEnum(GrantType)
    @IsNotEmpty()
    grantType: GrantType = GrantType.Password;
}
