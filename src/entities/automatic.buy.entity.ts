
import { Expose } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn,OneToOne, JoinColumn, ManyToOne, CreateDateColumn, Generated, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { User } from './user.entity';
import { Status } from 'src/common/enums/status.enum';

@Entity({name: 'automatic_buys'})
export class AutomaticBuy {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(type => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @ManyToOne(type => Coin,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'coin_id'})
  coin: Coin

  @Column({name: 'target_amount',default: 0.0, type: 'decimal', precision: 15, scale:2})
  targetAmount: number

  @Column({default: 0.0, type: 'decimal', precision: 15, scale:2})
  amount: number

  @Column({enum: Status})
  status: Status

  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date

  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updatedAt: Date

  @Column({name: 'expiry'})
  expiry: Date
}