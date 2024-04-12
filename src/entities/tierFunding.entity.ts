import { numberTransformer } from "src/common/transformers/decimal.transformer";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { FundingMethod } from "./fundingMethod.entity";
import { Tier } from "./tier.entity";


@Entity({ name: 'tier_fundings' })
export class TierFunding {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(() => FundingMethod, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'funding_method_id' })
    fundingMethod: FundingMethod

    @ManyToOne(() => Tier, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tier_id' })
    tier: Tier

    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 3, transformer: numberTransformer })
    fee: number

    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    min: number

    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    max: number

    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer, name: 'daily_limit' })
    dailyLimit: number

    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer, name: 'monthly_limit' })
    monthlyLimit: number

    @Column({name: 'is_active', default: false})
    isActive: boolean
}