

import { BeneficiaryType } from 'src/modules/send-globally/strike/enums/beneficiaryType.enum';
import { TransferType } from 'src/modules/send-globally/strike/enums/transferType.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AccountType } from 'src/modules/send-globally/strike/enums/accountType.enum';

export type StrikeBankPaymentMethodDocument = StrikeBankPaymentMethod & Document;

@Schema({timestamps: true})
export class StrikeBankPaymentMethod {

    @Prop({ required: true })
    userId: string

    @Prop({ required: true })
    strikeId: string

    @Prop({ required: true, enum: TransferType })
    transferType: TransferType;

    @Prop({ required: true })
    accountNumber: string;

    @Prop({ required: true })
    routingNumber: string;

    @Prop({ required: true, enum: AccountType })
    accountType: AccountType;

    @Prop({ required: true })
    bankName: string;

    @Prop({ required: true, type: Object })
    bankAddress: {
        country: string;
        state?: string;
        city: string;
        postCode: string;
        line1: string;
    };

    @Prop({ required: true, type: [Object] })
    beneficiaries: {
        type: string;
        name: string;
        email: string;
        phoneNumber: string;
        url: string
    }[];
}

export const StrikeBankPaymentMethodSchema = SchemaFactory.createForClass(StrikeBankPaymentMethod);
