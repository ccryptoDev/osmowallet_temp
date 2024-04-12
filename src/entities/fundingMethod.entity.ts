

import { numberTransformer } from "src/common/transformers/decimal.transformer";
import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { CountryFunding } from "./countryFunding.entity";
import { FundingMethodCoin } from "./fundingMethodCoin.entity";


@Entity({name: 'funding_methods'})
export class FundingMethod{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @Column({nullable: false})
    name: string

    @Column({default: 0.0, type: 'decimal', precision: 15, scale:2,transformer: numberTransformer})
    min: number

    @Column({default: 0.0, type: 'decimal', precision: 15, scale:2,transformer: numberTransformer})
    max: number
    
    @Column({default: 0.0, type: 'decimal', precision: 15, scale:3,transformer: numberTransformer})
    fee: number

    @Column({default: true})
    isActive: boolean

    @Column({nullable: false, default: 'TITLE'})
    title: string

    @Column({nullable: false})
    description: string

    @Column({name:'estimate_time', default: 'Inmediate'})
    estimateTime: string

    @OneToMany(() => FundingMethodCoin, (fundingMethodCoin) => fundingMethodCoin.fundingMethod)
    availableCoins: FundingMethodCoin[]

    @OneToMany(() => CountryFunding, (country) => country.fundingMethod)
    countries: CountryFunding
  
}