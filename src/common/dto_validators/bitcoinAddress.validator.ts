import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import * as lightningPayReq from 'bolt11';

export function IsBitcoinAddress(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isLightningAddress',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          if (value == null || value == undefined) return false;
          const isLnurl = value.toLowerCase().startsWith('lnurl');
          const isLnInvoice = value.toLowerCase().startsWith('lnbc');
          if (isLnInvoice) {
            try {
              lightningPayReq.decode(value.toLowerCase());
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
