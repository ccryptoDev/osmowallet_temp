import { Exclude } from 'class-transformer';
import { Entity, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { KycVerification } from './kycVerification.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'kyc_verification_steps' })
export class KycVerificationStep {
    @ApiProperty({
        example: 'c3f8a3e5-4e8d-4a7b-9a3c-2e5d8f9a1b2c',
        description: 'The unique identifier of the verification step',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The parent KYC verification associated with this step', required: true })
    @ManyToOne(() => KycVerification, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'kyc_verification_id' })
    verification!: KycVerification;

    @ApiProperty({ example: 'Step 1', description: 'The name or description of the verification step', required: true })
    @Column({ type: 'varchar', nullable: false })
    step!: string;

    @ApiProperty({ example: true, description: 'Indicates whether the verification step has been successfully verified', required: true })
    @Column({ default: false })
    verified!: boolean;

    @ApiProperty({
        example: 'Execution error',
        description: 'The error message if the verification step encountered an error',
        required: false,
    })
    @Column({ nullable: true, default: 'no ejecutado' })
    error!: string;

    @Exclude()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}
