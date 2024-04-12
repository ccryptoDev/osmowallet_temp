import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Coin } from "./coin.entity";


@Entity({name: 'country_coins'})
export class CountryCoin{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(() => Coin,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'coin_id'})
    coin: Coin

    @Column({name: 'country_code', default: 'GT'})
    countryCode: string

}