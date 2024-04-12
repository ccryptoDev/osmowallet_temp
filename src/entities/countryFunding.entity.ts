

import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { FundingMethod } from "./fundingMethod.entity";


@Entity({name: 'country_fundings'})
export class CountryFunding{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(type => FundingMethod,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'funding_id'})
    fundingMethod: FundingMethod

    @Column({name: 'country_code', default: 'GT'})
    countryCode: string

    @Column({name: 'is_active',default: true})
    isActive: boolean
  
}