import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';

export class DynamicDtoValidator {
    static async validateInputData<T extends object>(data: string, type: { new (): T }): Promise<T> {
        const methodDto = new type();
        if (data == undefined) throw new BadRequestException('Invalid data');
        const parsedData: object = JSON.parse(data);
        for (const key in parsedData) {
            if (parsedData.hasOwnProperty(key)) {
                methodDto[key as keyof typeof methodDto] = parsedData[key as keyof typeof parsedData];
            }
        }
        const errors = await validate(methodDto);
        if (errors.length > 0) {
            const messageError = errors.map((error) => Object.values(error.constraints ?? {})).join(', ');
            throw new BadRequestException(messageError);
        }
        return methodDto;
    }
}
