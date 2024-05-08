import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
export type CommerceDocument = HydratedDocument<Commerce>;

class Location {
    @Prop({ required: true, type: String, default: 'Point' })
    type!: string;

    @Prop({ required: true, type: [Number] })
    coordinates!: number[];
}

class OsmJson {
    @Prop({ required: true, type: Number })
    changeset!: number;

    @Prop({ required: true, type: Number })
    id!: number;

    @Prop({ required: true, type: Number })
    lat!: number;

    @Prop({ required: true, type: Number })
    lon!: number;

    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    tags!: mongoose.Schema.Types.Mixed;

    @Prop({ required: false, type: String, select: false })
    tagsString!: string;

    @Prop({ required: true, type: Date })
    timestamp!: Date;

    @Prop({ required: true, type: String })
    type!: string;

    @Prop({ required: true, type: Number })
    uid!: number;

    @Prop({ required: true, type: String })
    user!: string;

    @Prop({ required: true, type: Number })
    version!: number;

    @Prop({ required: false, type: Location })
    location!: Location;
}

@Schema()
export class Commerce {
    @Prop({ required: true })
    id!: string;

    @Prop({ type: OsmJson })
    osm_json!: mongoose.Schema.Types.Mixed;

    @Prop({ required: false })
    tags!: mongoose.Schema.Types.Mixed;

    @Prop({ required: false })
    created_at!: Date;

    @Prop({ required: false })
    updated_at!: Date;

    @Prop({ required: false })
    deleted_at!: Date;
}

export const CommerceSchema = SchemaFactory.createForClass(Commerce);
CommerceSchema.index({ 'osm_json.location': '2dsphere' });
