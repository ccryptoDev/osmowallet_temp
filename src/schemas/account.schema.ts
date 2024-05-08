import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class cryptomateAccount extends Document {

  @Prop()
  user_id!: string;

  @Prop()
  id!: string;

  @Prop()
  alias!: string;

  @Prop()
  wallets!: any[];
}

export const cryptomateAccountSchema = SchemaFactory.createForClass(cryptomateAccount);
