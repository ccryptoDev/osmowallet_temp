import * as lightningPayReq from 'bolt11';
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsLightningAddress(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isLightningAddress',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
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
