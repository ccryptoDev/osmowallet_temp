import { Contains, IsEnum, IsFirebasePushId, IsIP, IsNotEmpty, IsOptional, IsString, IsUUID, Validate } from "class-validator"
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Platform } from "src/common/enums/platform.enum";


export class SessionDto{

    @IsNotEmpty()
    location: string

    @IsIP()
    ip: any

    @IsString()
    device: string

    @IsEnum(Platform)
    platform: Platform
    
    @IsString()
    @IsOptional()
    token: string
}
