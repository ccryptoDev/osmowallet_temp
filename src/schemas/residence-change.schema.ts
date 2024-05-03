import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class ResidenceChange {
    @Prop()
    userId!: string;

    @Prop()
    country!: string;
}

export const ResidenceChangeSchema = SchemaFactory.createForClass(ResidenceChange);
