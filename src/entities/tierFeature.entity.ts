import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Tier } from "./tier.entity";
import { numberTransformer } from "src/common/transformers/decimal.transformer";
import { Feature } from "./feature.entity";


@Entity({name: 'tier_features'})
export class TierFeature{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: number;

    @ManyToOne(() => Feature,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'feature_id'})
    feature: Feature

    @ManyToOne(() => Tier,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'tier_id'})
    tier: Tier

    @Column({default: 0.0, type: 'decimal', precision: 15, scale:3,transformer: numberTransformer})
    fee: number

    @Column({default: 0.0, type: 'decimal', precision: 15, scale:2,transformer: numberTransformer})
    min: number

    @Column({default: 0.0, type: 'decimal', precision: 15, scale:2,transformer: numberTransformer})
    max: number

    @Column({default: 0.0, type: 'decimal', precision: 15, scale:2,transformer: numberTransformer,name: 'daily_limit'})
    dailyLimit: number

    @Column({default: 0.0, type: 'decimal', precision: 15, scale:2,transformer: numberTransformer, name: 'monthly_limit'})
    monthlyLimit: number

}