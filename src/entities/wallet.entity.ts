import { Entity, Column, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { Account } from './account.entity';
import { Coin } from './coin.entity';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';

@Entity({name: 'wallets'})
export class Wallet {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Account,{onDelete: 'RESTRICT'})
  @JoinColumn({name: 'account_id'})
  account: Account

  @ManyToOne(() => Coin,{onDelete: 'RESTRICT'})
  @JoinColumn({name: 'coin_id'})
  coin: Coin

  @Column({default: 0.0, type:'decimal', precision: 15, scale: 5,transformer: numberTransformer})
  balance: number

  @Column({name: 'available_balance', type:'decimal', precision: 15, scale: 5,transformer: numberTransformer, default: 0.0})
  availableBalance: number

  @Column({name: 'is_active', default: true})
  isActive: boolean

  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date;

  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updatedAt: Date;

  

}
