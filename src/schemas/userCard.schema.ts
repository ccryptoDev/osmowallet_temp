import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class UserCard {
    @Prop({ required: true })
    userId!: string;

    @Prop({ required: true })
    customerId!: string;
}

export const UserCardSchema = SchemaFactory.createForClass(UserCard);
