import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Terms {
    @Prop({ required: true })
    country!: string;
    @Prop({ required: true })
    terms!: string;
}

export const TermsSchema = SchemaFactory.createForClass(Terms);
