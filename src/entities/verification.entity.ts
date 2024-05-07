import { Entity, Column, OneToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'verifications' })
export class Verification {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the verification', example: 'c7e9a6e7-7e4d-4a4b-8b7a-3e9e8f9d0c1b', required: true })
    id!: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    @ApiProperty({ description: 'The user associated with the verification', required: true })
    user!: User;

    @Column({ default: false })
    @ApiProperty({ description: 'Flag indicating if email verification is completed', example: false, required: true })
    email!: boolean;

    @Column({ default: false })
    @ApiProperty({ description: 'Flag indicating if mobile verification is completed', example: false, required: true })
    mobile!: boolean;

    @Column({ default: false })
    @ApiProperty({ description: 'Flag indicating if KYC verification is completed', example: false, required: true })
    kyc!: boolean;
}
