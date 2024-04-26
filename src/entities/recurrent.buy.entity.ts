


import { Expose } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn,OneToOne, JoinColumn, ManyToOne, Generated, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { Period } from './period.entity';
import { User } from './user.entity';

@Entity({name: 'recurrent_buys'})
export class RecurrentBuy {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(type => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @ManyToOne(type => Period,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'period_id'})
  period: Period

  @ManyToOne(type => Coin,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'coin_id'})
  coin: Coin

  @Column({type: 'double precision'})
  amount: number

  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date

  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updatedAt: Date

  @Column({type: 'time'})
  time: string
  
}