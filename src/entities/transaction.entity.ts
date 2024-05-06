import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { TransactionDetail } from './transaction.detail.entity';
import { TransactionGroup } from './transactionGroup.entity';
import { Wallet } from './wallet.entity';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({
    default: 0.0,
    type: 'decimal',
    precision: 15,
    scale: 5,
    transformer: numberTransformer,
  })
  amount: number;

  @ManyToOne(() => TransactionGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_group_id' })
  transactionGroup: TransactionGroup;

  @Column({nullable: false})
  subtype: string;

  @Column({
    default: 0.0,
    type: 'decimal',
    precision: 15,
    scale: 5,
    transformer: numberTransformer,
  })
  balance: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToOne(
    () => TransactionDetail,
    (transactionDetail) => transactionDetail.transaction,
  )
  transactionDetail: TransactionDetail;
}
