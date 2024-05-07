import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'referral_source'})
export class ReferralSource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  source_name!: string;
}