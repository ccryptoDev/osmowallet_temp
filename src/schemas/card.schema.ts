


import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
class Card {
    @Prop({required: true})
    number: string;

    @Prop({required: true})
    holderName: string;
}

@Schema({timestamps: true})
export class OnvoPaymentMethod {
    @Prop({required: true})
    paymentMethodId: string;

    @Prop({required: true})
    userId: string

    @Prop({required: true})
    card: Card;

    @Prop({required: true})
    status: string;

    @Prop({required: true})
    type: string;

    @Prop({required: true})
    brand: string

    @Prop({required: true})
    alias: string

    @Prop({required: false, default: false})
    isDefault: boolean

}

export const OnvoPaymentMethodSchema = SchemaFactory.createForClass(OnvoPaymentMethod);



