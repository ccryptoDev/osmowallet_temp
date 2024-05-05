

import { Exclude } from 'class-transformer';
import { Entity, Column,OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { KycVerificationStep } from './kycVerificationStep.entity';
import { Status } from 'src/common/enums/status.enum';

@Entity({name: 'kyc_verifications'})
export class KycVerification {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToOne(() => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @Column({name: 'document_number', nullable: true})
  documentNumber: string

  @Column({enum: Status, default: Status.CREATED, nullable: false})
  status: Status

  @Column({default: false})
  duplicated: boolean

  @Exclude()
  @Column({name: 'verification_id'})
  verificationId: string

  @Column({default: 0})
  attemps: number

  @Exclude()
  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date

  @Exclude()
  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updatedAt: Date

  @OneToMany(() => KycVerificationStep, (kycVerificationStep) => kycVerificationStep.verification)
  verificationSteps: KycVerificationStep[]

}