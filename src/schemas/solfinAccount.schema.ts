import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
export type SolfinDocument = HydratedDocument<SolfinAccount>;

@Schema()
export class SolfinIbanAccount {
    @Prop({required: true})
    iban: string

    @Prop({required: true})
    currency: string

}
export const SolfinIbanAccountSchema = SchemaFactory.createForClass(SolfinIbanAccount);

@Schema({timestamps: true})
export class SolfinAccount {
    @Prop({required: true})
    userId: string

    @Prop({required: true})
    documentId: string

    @Prop({type: [SolfinIbanAccountSchema], required: false})
    accounts: SolfinIbanAccount[]
}


export const SolfinAccountSchema = SchemaFactory.createForClass(SolfinAccount);