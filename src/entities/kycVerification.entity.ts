import { Exclude } from 'class-transformer';
import { Entity, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { KycVerificationStep } from './kycVerificationStep.entity';
import { Status } from 'src/common/enums/status.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'kyc_verifications' })
export class KycVerification {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the KYC verification', example: 'c7e9a9e3-4d4b-4e2f-9e0a-8e4a2e3a1b2c', required: true })
    id!: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    @ApiProperty({ description: 'The user associated with the KYC verification', required: true })
    user!: User;

    @Column({ name: 'document_number', nullable: true })
    @ApiProperty({ description: 'The document number for the KYC verification', example: '1234567890', required: false })
    documentNumber!: string;

    @Column({ enum: Status, default: Status.CREATED, nullable: false })
    @ApiProperty({ description: 'The status of the KYC verification', example: 'CREATED', required: true })
    status!: Status;

    @Column({ default: false })
    @ApiProperty({ description: 'Indicates if the KYC verification is duplicated', example: false, required: true })
    duplicated!: boolean;

    @Exclude()
    @Column({ name: 'verification_id' })
    @ApiProperty({ description: 'The verification ID', example: 'abc123', required: true })
    verificationId!: string;

    @Column({ default: 0 })
    @ApiProperty({ description: 'The number of attempts for the KYC verification', example: 2, required: true })
    attemps!: number;

    @Exclude()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    @ApiProperty({
        description: 'The date and time when the KYC verification was created',
        example: '2022-01-01T12:00:00Z',
        required: true,
    })
    createdAt!: Date;

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    @ApiProperty({
        description: 'The date and time when the KYC verification was last updated',
        example: '2022-01-02T10:30:00Z',
        required: true,
    })
    updatedAt!: Date;

    @OneToMany(() => KycVerificationStep, (kycVerificationStep) => kycVerificationStep.verification)
    @ApiProperty({ description: 'The verification steps associated with the KYC verification', required: true })
    verificationSteps!: KycVerificationStep[];
}
