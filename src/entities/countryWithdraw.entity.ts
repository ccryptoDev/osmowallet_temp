

import { Exclude, Expose } from "class-transformer";
import { Column, Entity, Generated, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Country } from "./country.entity";
import { WithdrawalMethod } from "./withdrawalMethod.entity";


@Entity({name: 'country_withdraws'})
export class CountryWithdraw{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(type => WithdrawalMethod,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'withdraw_id'})
    withdrawlMethod: WithdrawalMethod

    @Column({name: 'country_code', default: 'GT'})
    countryCode: string

    @Column({name: 'is_active',default: true})
    isActive: boolean
  
}