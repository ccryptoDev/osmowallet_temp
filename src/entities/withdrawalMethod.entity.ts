

import { Exclude, Expose } from "class-transformer";
import { Column, Entity, Generated, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { WithdrawalMethodCoin } from "./withdrawalMethodCoin.entity";
import { numberTransformer } from "src/common/transformers/decimal.transformer";
import { CountryWithdraw } from "./countryWithdraw.entity";


@Entity({name: 'withdrawal_methods'})
export class WithdrawalMethod{
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

    @Column({nullable: true, default: 'Inmediate'})
    estimateTime: string

    @OneToMany(type => WithdrawalMethodCoin, (withdrawalMethodCoin) => withdrawalMethodCoin.withdrawalMethod)
    availableCoins: WithdrawalMethodCoin[]

    @OneToMany(type => CountryWithdraw, (country) => country.withdrawlMethod)
    countries: CountryWithdraw[]
  
}