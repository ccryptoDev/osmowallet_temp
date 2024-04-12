
import { Entity, Column,OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({name: 'verifications'})
export class Verification {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToOne(() => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @Column({default: false})
  email: boolean

  @Column({default: false})
  mobile: boolean;

  @Column({default: false})
  kyc: boolean;

}