import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'partner_config' })
export class PartnerConfig {
    @ApiProperty({
        description: 'The unique identifier of the partner config',
        example: 'c7b9e8a0-4e7d-4e4e-9d8f-3a2b1c0d2e1f',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The minimum value', example: 0, required: true })
    @Column({ default: 0, nullable: false })
    min!: number;

    @ApiProperty({ description: 'The maximum value', example: 100, required: true })
    @Column({ default: 0, nullable: false })
    max!: number;

    @ApiProperty({ description: 'The normal fee', example: 0.5, required: true })
    @Column({ name: 'normal_fee', default: 0, nullable: false, type: 'decimal', precision: 15, scale: 3, transformer: numberTransformer })
    normalFee!: number;

    @ApiProperty({ description: 'The withdraw fee', example: 0.1, required: true })
    @Column({ name: 'withdraw_fee', default: 0, nullable: false, type: 'decimal', precision: 15, scale: 3, transformer: numberTransformer })
    withdrawFee!: number;
}
