import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import mongoose from "mongoose"

@Schema({timestamps: true})
export class Terms {
    @Prop({required: true})
    country: String

    @Prop({required: true})
    terms: String

}

export const TermsSchema = SchemaFactory.createForClass(Terms);