import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class CommerceVersion {
    @Prop({ required: true })
    version!: number;
}

export const CommerceVersionSchema = SchemaFactory.createForClass(CommerceVersion);
