import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Feature } from './feature.entity';
import { User } from './user.entity';

@Entity({ name: 'user_transaction_limits' })
export class UserTransactionLimit {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Feature, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'feature_id' })
    feature: Feature;

    @Column({
        name: 'daily_amassed_amount',
        default: 0.0,
        type: 'decimal',
        precision: 15,
        scale: 2,
        transformer: numberTransformer,
    })
    dailyAmassedAmount: number;

    @Column({
        name: 'monthly_amassed_amount',
        default: 0.0,
        type: 'decimal',
        precision: 15,
        scale: 2,
        transformer: numberTransformer,
    })
    monthlyAmassedAmount: number;
}
