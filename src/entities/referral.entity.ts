import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { TransactionGroup } from './transactionGroup.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'referrals' })
export class Referral {
    @ApiProperty({ description: 'The unique identifier of the referral', example: 'c7a9e3a2-4e7d-4b1f-9e2a-3e4f5d6c7b8a', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The user who referred', example: 'John Doe', required: true })
    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'inviter_id', referencedColumnName: 'id' })
    inviter!: User;

    @ApiProperty({ description: 'The user who was invited', example: 'Jane Smith', required: true })
    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'invited_id', referencedColumnName: 'id' })
    invited!: User;

    @ApiProperty({ description: 'The phone number associated with the referral', example: '1234567890', required: false })
    @Column({ name: 'phone_number', nullable: true })
    phoneNumber!: string;

    @ApiProperty({ description: 'Flag indicating if the referral is an Osmo sponsor', example: true, required: false })
    @Column({ name: 'is_osmo_sponsor', default: false, type: 'boolean' })
    isOsmoSponsor!: boolean;

    @ApiProperty({ description: 'The transaction group associated with the referral', example: 'abc123', required: true })
    @OneToOne(() => TransactionGroup, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'transaction_group_id' })
    transactionGroup!: TransactionGroup;

    @ApiProperty({ description: 'The date and time the referral was created', example: '2022-01-01T00:00:00Z', required: true })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;
}
