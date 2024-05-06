
import { Expose } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn,ManyToOne,ManyToMany, JoinColumn,UpdateDateColumn,CreateDateColumn, Generated, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { TransactionGroup } from './transactionGroup.entity';

@Entity({name: 'referrals'})
export class Referral {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(type => User,{onDelete: 'CASCADE',nullable: true})
  @JoinColumn({name: 'inviter_id',referencedColumnName: 'id'})
  inviter: User

  @ManyToOne(type => User,{onDelete: 'CASCADE',nullable: true})
  @JoinColumn({name: 'invited_id',referencedColumnName: 'id'})
  invited: User

  @Column({name: 'phone_number',nullable: true})
  phoneNumber: string

  @Column({name: 'is_osmo_sponsor',default: false,type: 'boolean'})
  isOsmoSponsor: boolean

  @OneToOne(type => TransactionGroup, {onDelete: 'CASCADE'},)
  @JoinColumn({name: 'transaction_group_id'})
  transactionGroup: TransactionGroup

  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date

}