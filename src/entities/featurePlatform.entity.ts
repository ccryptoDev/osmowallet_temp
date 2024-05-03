import { Platform } from 'src/common/enums/platform.enum';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Feature } from './feature.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'feature_platforms' })
export class FeaturePlatform {
    @ApiProperty({ description: 'The unique identifier of the feature platform', example: 'c7b9e8a1-3e2b-4e0d-9f7a-2e9e4b6c5d4e' })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The feature associated with the platform', example: 'Feature A' })
    @ManyToOne(() => Feature, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'feature_id' })
    feature!: Feature;

    @ApiProperty({ description: 'The platform of the feature', example: 'Web', enum: Platform })
    @Column({ enum: Platform, nullable: true })
    platform!: Platform;

    @ApiProperty({ description: 'Indicates if the feature is active on the platform', example: true, default: true })
    @Column({ default: true })
    active!: boolean;
}
