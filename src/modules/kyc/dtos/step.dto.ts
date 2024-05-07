import { ApiProperty } from '@nestjs/swagger';

export class KycStepDto {
    status?: number;
    id?: string;
    error?: KycErrorDto;
    documentType?: string;
}

export class KycWorkFlowEventDto {
    @ApiProperty({
        description: 'The webhook secret',
        example: 'secret123',
    })
    webhookSecret!: string;

    @ApiProperty({
        description: 'The event name',
        example: 'kyc_workflow_event',
    })
    eventName!: string;

    @ApiProperty({
        description: 'The step information',
        example: {
            status: 1,
            id: 'step123',
            documentType: 'passport',
        },
    })
    step?: KycStepDto;

    @ApiProperty({
        description: 'The resource',
        example: 'resource123',
    })
    resource!: string;

    @ApiProperty({
        description: 'The timestamp',
        example: '2022-01-01T00:00:00Z',
    })
    timestamp!: string;

    @ApiProperty({
        description: 'The flow ID',
        example: 'flow123',
    })
    flowId!: string;

    @ApiProperty({
        description: 'The identity status',
        example: 'verified',
    })
    identityStatus?: string;

    @ApiProperty({
        description: 'The metadata',
        example: { key: 'value' },
    })
    metadata!: object;
}

export interface KycErrorDto {
    type: string;
    code: string;
    message: string;
}
