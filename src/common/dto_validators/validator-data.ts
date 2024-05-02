import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';

export class ValidatorData {
    static async validate<T>(data: T | string, classValidator: new () => T): Promise<T> {
        let validationData: T;
        if (typeof data === 'string') {
            try {
                validationData = JSON.parse(data);
            } catch (error) {
                throw new BadRequestException('Invalid JSON string');
            }
        } else {
            validationData = data;
        }
        const validatedData = plainToClass(classValidator, validationData);
        try {
            await validateOrReject(validatedData as object);
        } catch (errors) {
            if (errors instanceof Array) {
                const messages = errors.map((error) => Object.values(error.constraints));
                throw new BadRequestException(messages.flat());
            }
            throw new InternalServerErrorException(errors);
        }
        return validatedData;
    }
}
