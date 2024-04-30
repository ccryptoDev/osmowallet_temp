import { Entity, PrimaryColumn, OneToOne, JoinColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { ReferralSource } from './referral.source.entity';

@Entity({name: 'user_referral_source'})
export class UserReferralSource {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  mobile: string;
  
  @ManyToMany(() => ReferralSource, (referralSource) => referralSource.userReferralSources)
  @JoinTable()
  referralSources: ReferralSource[];
}
