import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class MongoWallet extends Document {
  @Prop()
  id!: string;

  @Prop()
  alias!: string;

  @Prop()
  wallet_adderss!: any[];

  @Prop()
  blockchain!: any[];
  
}

export const MongoWalletSchema = SchemaFactory.createForClass(MongoWallet);
