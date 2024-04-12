



import { validateOrReject } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

export class ValidatorData {
  static async validate<T>(data: T | string, classValidator: new () => T) : Promise<T> {
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
      const messages = errors.map(error => Object.values(error.constraints));
      throw new BadRequestException(messages.flat());
    }
    return validatedData;
  }
}
