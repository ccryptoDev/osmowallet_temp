import { Entity, Column, PrimaryGeneratedColumn,OneToOne, JoinColumn, Generated, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { Exclude, Expose } from "class-transformer";
import { Coin } from './coin.entity';
import { Bank } from './bank.entity';
import { BankAccountType } from 'src/common/enums/bankAccountType.enum';

@Entity({name: 'osmo_bank_accounts'})
export class OsmoBankAccount {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({name: 'account_type', enum: BankAccountType, default: BankAccountType.CORRIENTE,nullable: true})
  bankAccountType: BankAccountType

  @Column({name:'account_number'})
  accountNumber: string

  @Column({name: 'account_name'})
  accountName: string

  @ManyToOne(type => Coin,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'coin_id'})
  coin: Coin

  @ManyToOne(type => Bank,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'bank_id'})
  bank: Bank

  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date

  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updatedAt: Date

}