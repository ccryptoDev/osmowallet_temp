

export class KycWorkFlowEventDto {
    webhookSecret: string
    eventName: string
    step?: KycStepDto
    resource: string
    timestamp: string
    flowId: string
    identityStatus?: string
    metadata: {}
}

export interface KycStepDto {
    status: number
    id: string
    error?: KycErrorDto
    documentType: string
}

export interface KycErrorDto {
    type: string
    code: string
    message: string
}