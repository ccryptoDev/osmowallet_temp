
import { Entity, Column, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Wallet } from './wallet.entity';

@Entity({name: 'wallet_history'})
export class WalletHistory {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Wallet, {onDelete: 'RESTRICT'})
  @JoinColumn({name: 'wallet_id'})
  wallet: Wallet;

  @Column({default: 0.0, type:'decimal', precision: 15, scale: 5,transformer: numberTransformer})
  balance: number

  @Column({name: 'available_balance', type:'decimal', precision: 15, scale: 5,transformer: numberTransformer,default: 0.0})
  availableBalance: number

  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date;

  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updatedAt: Date;
 
  @Column({type: 'timestamp'})
  date: Date

}
