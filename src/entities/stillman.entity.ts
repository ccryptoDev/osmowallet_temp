import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'stillman_params' })
export class StillmanParams {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    buffer!: number;

    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    balancePercentage!: number;

    @Column({ default: 'bc1qdqdkujd64m4v48pr6wwhdp52xd9aq4xm39rwrn' })
    stillmanAddress!: string;

    @Column({ name: 'min_range', default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    minRange!: number;

    @Column({ name: 'max_range' , default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    maxRange!: number;
}
