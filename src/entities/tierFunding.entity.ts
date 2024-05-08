import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { FundingMethod } from './fundingMethod.entity';
import { Tier } from './tier.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'tier_fundings' })
export class TierFunding {
    @ApiProperty({
        description: 'The unique identifier of the tier funding',
        example: 'c6a7e9f3-4e0e-4e6f-9d8a-3c5b6a7b8c9d',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The funding method associated with the tier funding', example: 'Credit Card', required: true })
    @ManyToOne(() => FundingMethod, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'funding_method_id' })
    fundingMethod!: FundingMethod;

    @ApiProperty({ description: 'The tier associated with the tier funding', example: 'Tier 1', required: true })
    @ManyToOne(() => Tier, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tier_id' })
    tier!: Tier;

    @ApiProperty({ description: 'The fee for the tier funding', example: 0.0, required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 3, transformer: numberTransformer })
    fee!: number;

    @ApiProperty({ description: 'The minimum amount for the tier funding', example: 0.0, required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    min!: number;

    @ApiProperty({ description: 'The maximum amount for the tier funding', example: 0.0, required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    max!: number;

    @ApiProperty({ description: 'The daily limit for the tier funding', example: 0.0, required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer, name: 'daily_limit' })
    dailyLimit!: number;

    @ApiProperty({ description: 'The monthly limit for the tier funding', example: 0.0, required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer, name: 'monthly_limit' })
    monthlyLimit!: number;

    @ApiProperty({ description: 'Indicates whether the tier funding is active or not', example: false, required: true })
    @Column({ name: 'is_active', default: false })
    isActive!: boolean;
}
