import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class MongoAccount extends Document {
  @Prop()
  id!: string;

  @Prop()
  alias!: string;

  @Prop()
  wallets!: any[];
}

export const MongoAccountSchema = SchemaFactory.createForClass(MongoAccount);
