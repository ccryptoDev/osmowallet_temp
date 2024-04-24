import { Entity, PrimaryColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ReferralSource } from './referral.source.entity';

@Entity({name: 'user_referral_source'})
export class UserReferralSource {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id'})
  user: User;

  @OneToOne(() => ReferralSource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referral_source_id'})
  referralSource: ReferralSource;

}
