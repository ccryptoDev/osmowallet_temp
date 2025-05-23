import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isNull', async: false })
export class IsNullValue implements ValidatorConstraintInterface {
    validate(value: unknown) {
        return value === null;
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must be null.`;
    }
}
