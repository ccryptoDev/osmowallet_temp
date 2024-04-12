import { Exclude, Expose } from "class-transformer";
import { Column, Entity, Generated, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Coin } from "./coin.entity";
import { WithdrawalMethod } from "./withdrawalMethod.entity";

@Entity({name: 'withdrawal_method_coins'})
export class WithdrawalMethodCoin {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(type => WithdrawalMethod,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'withdrawal_method_id'})
    @Exclude()
    withdrawalMethod: WithdrawalMethod

    @ManyToOne(type => Coin,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'coin_id'})
    coin: Coin

}