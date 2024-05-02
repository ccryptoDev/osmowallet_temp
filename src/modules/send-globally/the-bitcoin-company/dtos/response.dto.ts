import { ApiProperty } from '@nestjs/swagger';

class RequiredField {
    @ApiProperty({ description: 'The name of the field', example: 'fieldName' })
    name!: string;

    @ApiProperty({ description: 'The datatype of the field', example: 'string' })
    datatype!: string;

    @ApiProperty({ description: 'The validation rule for the field', example: 'required', required: false })
    validation?: string;

    @ApiProperty({ description: 'The options for the field', example: [{ name: 'option1', value: 'value1' }] })
    options?: Array<{ name: string; value: string }>;
}

class PayoutOption {
    @ApiProperty({ description: 'The ID of the payout option', example: 'optionId' })
    id!: string;

    @ApiProperty({ description: 'The name of the payout option', example: 'optionName' })
    name!: string;

    @ApiProperty({ description: 'The logo URL of the payout option', example: 'https://example.com/logo.png' })
    logourl!: string;

    @ApiProperty({ description: 'The required fields for the payout option', example: [new RequiredField()] })
    requiredFields!: Array<RequiredField>;
}

class Result {
    @ApiProperty({ description: 'The callback value', example: 'callbackValue' })
    callback!: string;

    @ApiProperty({ description: 'The tag value', example: 'tagValue' })
    tag!: string;

    @ApiProperty({ description: 'The maximum sendable value', example: 100 })
    maxSendable!: number;

    @ApiProperty({ description: 'The minimum sendable value', example: 10 })
    minSendable!: number;

    @ApiProperty({ description: 'The metadata value', example: 'metadataValue' })
    metadata!: string;

    @ApiProperty({ description: 'The supported payout options', example: [new PayoutOption()] })
    supportedPayoutOptions!: Array<PayoutOption>;
}

export class OptionsResponseDTO {
    @ApiProperty({ description: 'The status code', example: 200 })
    statusCode!: number;

    @ApiProperty({ description: 'The result object', example: new Result() })
    result!: Result;
}

export class PayoutResponseDTO {
    @ApiProperty({ description: 'The status code', example: 200 })
    statusCode!: number;

    @ApiProperty({
        description: 'The destination exchange data',
        example: { id: 'exchangeId', currency: 'USD', price: 100, expiry: 1234567890, pr: 'prValue' },
    })
    result!: {
        destExchangeData: {
            id: string;
            currency: string;
            price: number;
            expiry: number;
            pr: string;
        };
    };
}

export class ErrorResponseDTO {
    @ApiProperty({ description: 'The status code', example: 400 })
    status!: number;

    @ApiProperty({ description: 'The error message', example: 'Error message' })
    error!: string;
}
