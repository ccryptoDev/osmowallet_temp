import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Country extends Document {
    @Prop({ required: true })
    cca2!: string;

    @Prop({ required: true })
    cca3!: string;

    @Prop({ required: true })
    ccn3!: number;

    @Prop({ required: true })
    name!: string;
}

export const CountrySchema = SchemaFactory.createForClass(Country);
