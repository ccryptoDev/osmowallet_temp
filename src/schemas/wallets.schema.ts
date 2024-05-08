import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class cryptomateWallet extends Document {
  @Prop()
  user_id!: string;
  
  @Prop()
  id!: string;

  @Prop()
  alias!: string;

  @Prop()
  wallet_adderss!: any[];

  @Prop()
  blockchain!: any[];
  
}

export const cryptomateWalletSchema = SchemaFactory.createForClass(cryptomateWallet);
