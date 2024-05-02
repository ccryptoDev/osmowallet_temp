import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'autoconverts' })
export class Autoconvert {
    @ApiProperty({
        description: 'The unique identifier of the autoconvert',
        example: 'c7a2c8e1-4e6f-4d9a-9e8b-5e2e9e0a3f4b',
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The user associated with the autoconvert',
        example: { id: 'c7a2c8e1-4e6f-4d9a-9e8b-5e2e9e0a3f4b', name: 'John Doe' },
        required: true,
    })
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The coin associated with the autoconvert',
        example: { id: 'c7a2c8e1-4e6f-4d9a-9e8b-5e2e9e0a3f4b', name: 'Bitcoin' },
        required: true,
    })
    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    coin!: Coin;

    @ApiProperty({
        description: 'Indicates whether the autoconvert is active',
        example: true,
        required: true,
    })
    @Column({ name: 'is_active', default: false })
    isActive!: boolean;

    @ApiProperty({
        description: 'The percentage for the autoconvert',
        example: 100,
        required: true,
    })
    @Column({ default: 100 })
    percent!: number;

    @ApiProperty({
        description: 'The date and time when the autoconvert was created',
        example: '2022-01-01T12:00:00Z',
        required: true,
    })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({
        description: 'The date and time when the autoconvert was last updated',
        example: '2022-01-01T12:00:00Z',
        required: true,
    })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}
