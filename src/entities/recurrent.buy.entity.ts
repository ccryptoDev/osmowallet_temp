import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'recurrent_buys' })
export class RecurrentBuy {
    @ApiProperty({ description: 'The unique identifier of the recurrent buy', example: 'c7b9e3e0-2e4e-4b3a-9e4a-1c8e7d6f5a2b' })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The user associated with the recurrent buy', example: 'John Doe', required: true })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({ description: 'The number of days between each recurrent buy', example: 7, required: true })
    @Column({ type: 'smallint' })
    days!: number;

    @ApiProperty({ description: 'The coin associated with the recurrent buy', example: 'Bitcoin', required: true })
    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    coin!: Coin;

    @ApiProperty({ description: 'The amount of the recurrent buy', example: 100.5, required: true })
    @Column({ type: 'double precision' })
    amount!: number;

    @ApiProperty({ description: 'The date and time when the recurrent buy was created', example: '2022-01-01T12:00:00Z', required: true })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({
        description: 'The date and time when the recurrent buy was last updated',
        example: '2022-01-02T12:00:00Z',
        required: true,
    })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @ApiProperty({ description: 'The time of day when the recurrent buy should occur', example: '09:00:00', required: true })
    @Column({ type: 'time' })
    time!: string;
}
