
import { Entity, Column, PrimaryGeneratedColumn,OneToOne, JoinColumn, Generated, ManyToOne, ManyToMany, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { AccountType } from 'src/common/enums/accountType.enum';

@Entity({name: 'accounts'})
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(type => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @Column({name: 'account_type', enum: AccountType, default: AccountType.INDIVIDUAL})
  accountType: AccountType

  @Column({nullable: true})
  alias: string

}