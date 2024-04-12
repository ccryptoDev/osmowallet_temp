import { Exclude } from "class-transformer";
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Coin } from "./coin.entity";
import { FundingMethod } from "./fundingMethod.entity";

@Entity({name: 'funding_method_coins'})
export class FundingMethodCoin {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(() => FundingMethod,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'funding_method_id'})
    @Exclude()
    fundingMethod: FundingMethod

    @ManyToOne(() => Coin,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'coin_id'})
    coin: Coin

}