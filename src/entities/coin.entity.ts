import { Entity, Column, PrimaryColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({name: 'coins'})
export class Coin {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  name: string

  @Column()
  flag: string;

  @Column({name: 'exchange_rate',type:'float'})
  exchangeRate: number;

  @Column({unique: true})
  acronym: string

  @Exclude()
  @Column({name: 'is_active', default: false})
  isActive: boolean
}