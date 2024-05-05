import { numberTransformer } from "src/common/transformers/decimal.transformer";
import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { TierFeature } from "./tierFeature.entity";
import { TierUser } from "./tierUser.entity";


@Entity({name: 'tiers'})
export class Tier{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @Column({nullable: false})
    name: string

    @OneToMany(type => TierUser, tierUser => tierUser.tier)
    tierUsers: TierUser[];

    @OneToMany(type => TierFeature, tierFeature => tierFeature.tier)
    tierFeatures: TierFeature[];
  
}