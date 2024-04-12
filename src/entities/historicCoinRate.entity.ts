import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { HistoricRate } from "./historicRates.entity";
import { Coin } from "./coin.entity";

@Entity({name: 'historic_coin_rate'})
export class HistoricCoinRate {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => HistoricRate,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'historic_rate_id'})
  historicRate: HistoricRate

  @ManyToOne(() => Coin,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'coin_id'})
  coin: Coin

  @Column({name: 'exchange_rate',type:'float'})
  exchangeRate: number;

}