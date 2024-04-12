
import { Column, Entity, Generated, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Feature } from "./feature.entity";
import { Platform } from "src/common/enums/platform.enum";


@Entity({name: 'feature_platforms'})
export class FeaturePlatform{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(type => Feature,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'feature_id'})
    feature: Feature

    @Column({enum: Platform, nullable: true})
    platform: Platform

    @Column({default: true})
    active: boolean

}