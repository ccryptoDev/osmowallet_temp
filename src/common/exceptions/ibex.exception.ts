import { BadRequestException, HttpException, HttpStatus } from "@nestjs/common";

export class IbexServiceException extends BadRequestException {
    constructor(objectOrError?: string | object | any, descriptionOrOptions?: string | object | any) {
        super(objectOrError, descriptionOrOptions);
    }
}
