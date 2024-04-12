import { PartnerStatus } from "../enums/partnerEvent.enum"

export interface InvoiceReference {
    event: PartnerStatus
    referenceId: string
    webhookURL: string,
    secretKey: string
}