import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { FundingMethod } from './fundingMethod.entity';


@Entity({ name: 'funding_transaction_limits' })
export class FundingTransactionLimit {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(()=> FundingMethod, {onDelete: 'CASCADE'})
    @JoinColumn({name: 'fundingmethod_id'})
    fundingmethod: FundingMethod

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
