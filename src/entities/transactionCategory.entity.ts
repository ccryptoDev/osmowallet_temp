import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'transaction_categories' })
export class TransactionCategory {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the transaction category', example: 'c3f4a7d9-2e6b-4a8c-9e5d-1f3e2d1c0b9a', required: true })
    id!: string;

    @Column()
    @ApiProperty({ description: 'The name of the transaction category', example: 'Food', required: true })
    name!: string;

    @Column({ default: 61449 })
    @ApiProperty({ description: 'The icon of the transaction category', example: 61449, required: false })
    icon!: number;

    @Column({ default: '#FF779ECB' })
    @ApiProperty({ description: 'The color of the transaction category', example: '#FF779ECB', required: false })
    color!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'from_user_id' })
    @ApiProperty({ description: 'The user associated with the transaction category', required: false })
    user!: User;
}
