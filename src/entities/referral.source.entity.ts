import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { UserReferralSource } from './user.referral.source.entity';

@Entity({name: 'referral_source'})
export class ReferralSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  source_name: string;
}