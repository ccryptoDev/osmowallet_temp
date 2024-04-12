import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { User } from './user.entity';

@Entity({ name: 'recurrent_buys' })
export class RecurrentBuy {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'smallint' })
    days: number;

    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    coin: Coin;

    @Column({ type: 'double precision' })
    amount: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @Column({ type: 'time' })
    time: string;
}
