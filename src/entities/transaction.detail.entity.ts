
import { Exclude, Expose } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn,OneToOne, JoinColumn, ManyToOne, Generated, PrimaryColumn } from 'typeorm';
import { BankAccount } from './bank.account.entity';
import { Coin } from './coin.entity';
import { Transaction } from './transaction.entity';
import { User } from './user.entity';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';

@Entity({name: 'transaction_details'})
export class TransactionDetail {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToOne(type => Transaction,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'transaction_id'})
  transaction: Transaction

  @Column({name: 'ibex_transaction_id',nullable: true})
  ibexTransactionId: string

  @Column({length: 1000,nullable: true})
  address: string

  @Column({name: 'proof',nullable: true, length: 1000})
  proofUrl: string

  @Column({name: 'proof_path',nullable: true})
  @Exclude()
  proofPath: string

  @Column({name: 'proof_expiry', nullable: true})
  @Exclude()
  proofExpiry: Date

  @Column({type: 'simple-json',nullable: true})
  metadata: {}
}