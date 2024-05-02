import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { FundingMethod } from './fundingMethod.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'funding_transaction_limits' })
export class FundingTransactionLimit {
    @ApiProperty({
        description: 'The unique identifier of the funding transaction limit',
        example: 'c7b9e4a6-8e1e-4e3a-9b1a-2e7f5d6c8d9e',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The user associated with the funding transaction limit',
        example: { id: '123', name: 'John Doe' },
        required: true,
    })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The funding method associated with the funding transaction limit',
        example: { id: '456', name: 'Credit Card' },
        required: true,
    })
    @ManyToOne(() => FundingMethod, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fundingmethod_id' })
    fundingmethod!: FundingMethod;

    @ApiProperty({
        description: 'The daily amassed amount for the funding transaction limit',
        example: 100.0,
        required: true,
    })
    @Column({
        name: 'daily_amassed_amount',
        default: 0.0,
        type: 'decimal',
        precision: 15,
        scale: 2,
        transformer: numberTransformer,
    })
    dailyAmassedAmount!: number;

    @ApiProperty({
        description: 'The monthly amassed amount for the funding transaction limit',
        example: 1000.0,
        required: true,
    })
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
