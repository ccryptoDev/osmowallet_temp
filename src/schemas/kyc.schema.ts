import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class KycPartner {
    @Prop()
    partner!: string;

    @Prop()
    status!: string;
}
export const KycPartnerSchema = SchemaFactory.createForClass(KycPartner);

@Schema({ timestamps: true })
export class KycPartnerStatus {
    @Prop({ required: true })
    userId!: string;

    @Prop({ type: [KycPartnerSchema], required: false })
    kycs!: KycPartner[];
}

export const KycPartnerStatusSchema = SchemaFactory.createForClass(KycPartnerStatus);
