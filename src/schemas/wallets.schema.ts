import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class cryptomateWallet extends Document {

  @Prop()
  id!: string;

  @Prop()
  alias!: string;

  @Prop()
  wallet_address!: string;

  @Prop()
  blockchain!: string;
  
  @Prop()
  enabled!: boolean;
}

export const cryptomateWalletSchema = SchemaFactory.createForClass(cryptomateWallet);
