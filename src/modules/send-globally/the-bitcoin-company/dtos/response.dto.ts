class RequiredField {
    name: string;
    datatype: string;
    validation?: string;
    options?: Array<{ name: string; value: string }>;
}

class PayoutOption {
    id: string;
    name: string;
    logourl: string;
    requiredFields: Array<RequiredField>;
}

class Result {
    callback: string;
    tag: string;
    maxSendable: number;
    minSendable: number;
    metadata: string;
    supportedPayoutOptions: Array<PayoutOption>;
}

export class OptionsResponseDTO {
    statusCode: number;
    result: Result;
}

export class PayoutResponseDTO {
    statusCode: number;
    result: {
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
    status: number;
    error: string;
}

