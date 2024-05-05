import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'otp_codes' })
export class Otp {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  input: string;

  @Column()
  otp: number;

  @Column({ type: "varchar", nullable: false })
  type: string;

  @Column({ name: 'expiry' })
  expiry: Date;
}
