import { registerDecorator, ValidationOptions } from "class-validator";
import { phone } from 'phone';

export function IsMobileValid(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
      registerDecorator({
        name: 'isMobileValid',
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        validator: {
          validate(value: any) {
            return phone(value).isValid
          },
        },
      });
    };
}