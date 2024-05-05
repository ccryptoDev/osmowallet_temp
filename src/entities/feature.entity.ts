

import { Exclude, Expose } from "class-transformer";
import { Column, Entity, Generated, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { FeaturePlatform } from "./featurePlatform.entity";
import { numberTransformer } from "src/common/transformers/decimal.transformer";
import { FeatureCountry } from "./featureCountry.entity";


@Entity({name: 'features'})
export class Feature{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @Column({nullable: false})
    name: string

    @Column({name: 'is_active',default: true})
    isActive: boolean
    
    @OneToMany(type => FeaturePlatform,(featurePlatform) => featurePlatform.feature)
    platforms: FeaturePlatform[]

    @OneToMany(type => FeatureCountry,(featureCountry) => featureCountry.feature)
    countries: FeatureCountry[]
  
}