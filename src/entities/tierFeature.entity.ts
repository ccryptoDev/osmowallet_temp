import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Tier } from './tier.entity';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Feature } from './feature.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'tier_features' })
export class TierFeature {
    @ApiProperty({ description: 'The unique identifier of the tier feature', example: 'c7b9e1e0-8d6f-4e5a-9b6a-3e8e9d4c2f1a' })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: number;

    @ApiProperty({ description: 'The feature associated with the tier feature', example: 'Some feature' })
    @ManyToOne(() => Feature, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'feature_id' })
    feature!: Feature;

    @ApiProperty({ description: 'The tier associated with the tier feature', example: 'Some tier' })
    @ManyToOne(() => Tier, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tier_id' })
    tier!: Tier;

    @ApiProperty({ description: 'The fee of the tier feature', example: 0.0, required: false })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 3, transformer: numberTransformer })
    fee!: number;

    @ApiProperty({ description: 'The minimum value of the tier feature', example: 0.0, required: false })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    min!: number;

    @ApiProperty({ description: 'The maximum value of the tier feature', example: 0.0, required: false })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    max!: number;

    @ApiProperty({ description: 'The daily limit of the tier feature', example: 0.0, required: false, name: 'daily_limit' })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer, name: 'daily_limit' })
    dailyLimit!: number;

    @ApiProperty({ description: 'The monthly limit of the tier feature', example: 0.0, required: false, name: 'monthly_limit' })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer, name: 'monthly_limit' })
    monthlyLimit!: number;
}
