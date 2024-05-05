import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function IsValidPassword(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
      registerDecorator({
        name: 'isValidPassword',
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        validator: {
          validate(value: any) {
            const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
            return re.test(value)
          },
        },
      });
    };
  }

export function IsValidConfirmPassword(property: string,validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
      registerDecorator({
        name: 'isValidConfirmPassword',
        target: object.constructor,
        propertyName: propertyName,
        constraints: [property],
        options: validationOptions,
        validator: {
          validate(value: any, args: ValidationArguments) {
            const [relatedPropertyName] = args.constraints;
            const relatedValue = (args.object as any)[relatedPropertyName];
            return  relatedValue === value
          },
        },
      });
    };
}