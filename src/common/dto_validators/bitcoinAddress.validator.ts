import * as lightningPayReq from 'bolt11';
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsBitcoinAddress(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isLightningAddress',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: string) {
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
