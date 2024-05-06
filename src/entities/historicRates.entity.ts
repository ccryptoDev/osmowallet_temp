import { CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { HistoricCoinRate } from "./historicCoinRate.entity";


@Entity({name: 'historic_rate'})
export class HistoricRate {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToMany(() => HistoricCoinRate,(historicCoinRate) => historicCoinRate.historicRate)
  historicCoinRate: HistoricCoinRate[]

  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date;

  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updatedAt: Date;
}