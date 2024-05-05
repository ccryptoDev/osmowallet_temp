



import { Exclude, Expose } from "class-transformer";
import { Column, Entity, Generated, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Feature } from "./feature.entity";
import { Country } from "./country.entity";


@Entity({name: 'feature_countries'})
export class FeatureCountry{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(type => Feature,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'feature_id'})
    feature: Feature

    @ManyToOne(type => Country,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'country_id', referencedColumnName: 'id', foreignKeyConstraintName: 'feature_countries_country_fk'})
    country: Country

    @Column({default: true})
    active: boolean

}