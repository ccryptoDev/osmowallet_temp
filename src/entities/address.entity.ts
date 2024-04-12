
import { Exclude } from 'class-transformer';
import { Entity, Column,OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({name:'addresses'})
export class Address {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToOne(() => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @Column()
  ln: string

  @Column({name: 'onchain'})
  onChain: string;

  @Exclude()
  @Column({name: 'lnurl_payer'})
  lnUrlPayer: string;

}