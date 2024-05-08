import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class UsaUser {
    @Prop()
    input!: string;

    @Prop()
    country!: string;
}

export const UsaUserSchema = SchemaFactory.createForClass(UsaUser);
