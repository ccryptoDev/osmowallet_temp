import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import * as lightningPayReq from 'bolt11';

export function IsLightningAddress(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isLightningAddress',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const isLnurl = value.startsWith('LNURL');
          const isLnInvoice = value.startsWith('lnbc');
          if (isLnInvoice) {
            try {
              lightningPayReq.decode(value);
            } catch (error) {
              return false;
            }
          }
          return isLnurl || isLnInvoice;
        },
      },
    });
  };
}
