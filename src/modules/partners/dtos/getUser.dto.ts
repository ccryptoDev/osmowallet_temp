import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { ValidationOptions, registerDecorator } from 'class-validator';

export function IsMobilePhoneWithoutPlus(
  validationOptions?: ValidationOptions,
) {
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
  phoneNumber: string;
}
export class GetUserbyPhoneOrEmailDto {
    @IsOptional()
    @IsMobilePhoneWithoutPlus()
    phoneNumber?: string;

    @IsEmail()
    @IsOptional()
    email?: string;
}
