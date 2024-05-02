import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Feature } from './feature.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'user_transaction_limits' })
export class UserTransactionLimit {
    @ApiProperty({
        description: 'The unique identifier of the transaction limit',
        example: 'c7a9e8b2-4e0e-4a5f-9e3d-3e4f5a6b7c8d',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The user associated with the transaction limit', example: 'John Doe', required: true })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({ description: 'The feature associated with the transaction limit', example: 'Transaction Limit', required: true })
    @ManyToOne(() => Feature, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'feature_id' })
    feature!: Feature;

    @ApiProperty({ description: 'The daily amassed amount', example: 100.0, required: true })
    @Column({
        name: 'daily_amassed_amount',
        default: 0.0,
        type: 'decimal',
        precision: 15,
        scale: 2,
        transformer: numberTransformer,
    })
    dailyAmassedAmount!: number;

    @ApiProperty({ description: 'The monthly amassed amount', example: 500.0, required: true })
    @Column({
        name: 'monthly_amassed_amount',
        default: 0.0,
        type: 'decimal',
        precision: 15,
        scale: 2,
        transformer: numberTransformer,
    })
    monthlyAmassedAmount!: number;
}
