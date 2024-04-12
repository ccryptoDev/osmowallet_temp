import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { CurrencyEnum } from "src/modules/ibex/enum/currencies.enum";
import { Types } from "src/modules/ibex/enum/type.enum";

@Schema({ _id: false })
export class Address {
    @Prop({ required: true, default: ""})
    address: string;
    
    @Prop({ required: true, enum: CurrencyEnum, default: CurrencyEnum.BTC })
    currency: CurrencyEnum;

    @Prop({ required: true, enum: Types, default: Types.LNURL })
    type: Types;
}
export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema()
export class Addresses {
    @Prop({ required: true })
    user: string;

    @Prop({ required: true, type: [AddressSchema] })
    addresses: Address[];
}

export const AddressesSchema = SchemaFactory.createForClass(Addresses);
