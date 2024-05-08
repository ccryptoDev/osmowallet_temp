import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ReferralSource } from './referral.source.entity';

@Entity({name: 'user_referral_source'})
export class UserReferralSource {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ unique: true, nullable: true })
  email!: string;

  @Column({ unique: true, nullable: true })
  mobile!: string;

  @Column({ nullable: true })
  referralSources!: string;
}
