import { Status } from 'src/common/enums/status.enum';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'automatic_buys' })
export class AutomaticBuy {
    @ApiProperty({
        description: 'The unique identifier of the automatic buy',
        example: 'c7b9e8a1-3e5f-4b7d-9a2c-6f8e7d6c5b4a',
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The user associated with the automatic buy',
        example: { id: '1', name: 'John Doe' },
    })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The coin associated with the automatic buy',
        example: { id: '1', name: 'Bitcoin' },
    })
    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    coin!: Coin;

    @ApiProperty({
        description: 'The target amount for the automatic buy',
        example: 100.0,
    })
    @Column({ name: 'target_amount', default: 0.0, type: 'decimal', precision: 15, scale: 2 })
    targetAmount!: number;

    @ApiProperty({
        description: 'The amount for the automatic buy',
        example: 50.0,
    })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2 })
    amount!: number;

    @ApiProperty({
        description: 'The status of the automatic buy',
        example: 'Pending',
    })
    @Column({ enum: Status })
    status!: Status;

    @ApiProperty({
        description: 'The creation date of the automatic buy',
        example: '2022-01-01T00:00:00Z',
    })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({
        description: 'The last update date of the automatic buy',
        example: '2022-01-02T00:00:00Z',
    })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @ApiProperty({
        description: 'The expiry date of the automatic buy',
        example: '2022-01-03T00:00:00Z',
    })
    @Column({ name: 'expiry' })
    expiry!: Date;
}
