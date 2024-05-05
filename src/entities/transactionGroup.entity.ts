import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { Coin } from './coin.entity';
import { HistoricRate } from './historicRates.entity';
import { OsmoBusinessBpt } from './osmoBusinessBPT.entity';
import { Transaction } from './transaction.entity';
import { TransactionCategory } from './transactionCategory.entity';
import { TransactionFee } from './transactionFee.entity';
import { User } from './user.entity';
import { Referral } from './referral.entity';

@Entity({ name: 'transaction_groups' })
export class TransactionGroup {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ enum: TransactionType, nullable: true })
  type: TransactionType;

  @Column({ enum: Status, default: Status.PENDING })
  status: Status;

  @ManyToOne(() => TransactionCategory, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transaction_category_id' })
  category: TransactionCategory;

  @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transaction_coin_id' })
  transactionCoin: Coin;

  @Column({
    name: 'btc_price',
    nullable: true,
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: numberTransformer,
  })
  btcPrice: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;

  @OneToOne(() => Referral, (referral) => referral.transactionGroup)
  referral: Referral

  @Column({ nullable: true })
  note: string;

  @Column({ enum: Partner, nullable: true })
  partner: Partner;

  @Column({ type: 'varchar',nullable: true })
  method: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: object;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(
    () => Transaction,
    (transaction) => transaction.transactionGroup,
  )
  transactions: Transaction[];

  @OneToMany(() => TransactionFee, (fee) => fee.transactionGroup)
  fees: TransactionFee[];

  @ManyToOne(() => HistoricRate, { onDelete: 'CASCADE' })
  historicRate: HistoricRate;

  @ManyToOne(() => OsmoBusinessBpt, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'osmo_bussiness_id' })
  osmoBusiness: OsmoBusinessBpt;
}
