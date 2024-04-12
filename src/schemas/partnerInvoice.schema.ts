import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Partner } from "src/common/enums/partner.enum";
import { PartnerStatus } from "src/modules/partners/enums/partnerEvent.enum";
import { PartnerFlow } from "src/modules/partners/enums/partnerFlow.enum";
interface Amount {
    currency: string;
    amount: number;
}

export type PartnerInvoiceDocument = PartnerInvoice & Document;

@Schema({timestamps: true})
export class PartnerInvoice {

    @Prop({ required: false })
    userId: string

    @Prop({ required: true })
    referenceId: string

    @Prop({required: false})
    transactionId: string

    @Prop({required: true})
    description: string

    @Prop({required: false})
    phoneNumber: string

    @Prop({ required: true, enum: Partner })
    partner: Partner

    @Prop({ required: true, enum: PartnerFlow })
    flow: PartnerFlow

    @Prop({ required: true, enum: PartnerStatus })
    status: PartnerStatus

    @Prop({required: true})
    bolt11: string

    @Prop({ required: true })
    btcPrice: number

    @Prop({ required: true, type: Object })
    originalAmount: Amount

    @Prop({ required: true, type: Object })
    sourceAmount: Amount;

    @Prop({ required: true, type: Object })
    targetAmount: Amount;

    @Prop({ required: false, type: Object })
    bankAccount: {
        type: string;
        acountNumber: string;
        accountHolder: string;
        currency: string;
        bankName: string;
        bankCode: number
    };
}

export const PartnerInvoiceSchema = SchemaFactory.createForClass(PartnerInvoice);
