import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type SolfinDocument = HydratedDocument<RidiviAccount>;

@Schema()
export class RidiviIbanAccount {
    @Prop({ required: true })
    iban!: string;

    @Prop({ required: true })
    currency!: string;
}
export const RidiviIbanAccountSchema = SchemaFactory.createForClass(RidiviIbanAccount);

@Schema({ timestamps: true })
export class RidiviAccount {
    @Prop({ required: true })
    userId!: string;

    @Prop({ required: true })
    documentId!: string;

    @Prop({ type: [RidiviIbanAccountSchema], required: false })
    accounts!: RidiviIbanAccount[];
}

export const RidiviAccountSchema = SchemaFactory.createForClass(RidiviAccount);
