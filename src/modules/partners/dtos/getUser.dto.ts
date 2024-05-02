import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { ValidationOptions, registerDecorator } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export function IsMobilePhoneWithoutPlus(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsMobilePhoneWithoutPlus',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    const re = /^(\d{10,15})$/;
                    return re.test(value);
                },
                defaultMessage() {
                    return 'Phone ($value) is not a valid mobile phone number';
                },
            },
        });
    };
}

export class GetUserbyPhoneDto {
    @IsNotEmpty()
    @IsMobilePhoneWithoutPlus()
    @ApiProperty({
        description: 'The phone number of the user',
        example: '1234567890',
    })
    phoneNumber!: string;
}

export class GetUserbyPhoneOrEmailDto {
    @IsOptional()
    @IsMobilePhoneWithoutPlus()
    @ApiProperty({
        description: 'The phone number of the user',
        example: '1234567890',
    })
    phoneNumber?: string;

    @IsEmail()
    @IsOptional()
    @ApiProperty({
        description: 'The email address of the user',
        example: 'user@example.com',
    })
    email?: string;
}
