

import { Exclude } from 'class-transformer';
import { Entity, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { KycVerification } from './kycVerification.entity';

@Entity({name: 'kyc_verification_steps'})
export class KycVerificationStep {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => KycVerification,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'kyc_verification_id'})
  verification: KycVerification

  @Column({type: 'varchar', nullable: false})
  step: string

  @Column({default: false})
  verified: boolean

  @Column({nullable: true, default: 'no ejecutado'})
  error: string

  @Exclude()
  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date

  @Exclude()
  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updatedAt: Date

}