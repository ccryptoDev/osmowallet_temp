import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { FeatureCountry } from './featureCountry.entity';
import { FeaturePlatform } from './featurePlatform.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'features' })
export class Feature {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The unique identifier of the feature', example: 'c7b9e3a1-2e9d-4a5f-9e5c-8e8e8e8e8e8e', required: true })
    id!: string;

    @Column({ nullable: false })
    @ApiProperty({ description: 'The name of the feature', example: 'Some Feature', required: true })
    name!: string;

    @Column({ name: 'is_active', default: true })
    @ApiProperty({ description: 'Indicates if the feature is active', example: true, required: false })
    isActive!: boolean;

    @OneToMany(() => FeaturePlatform, (featurePlatform) => featurePlatform.feature)
    @ApiProperty({ description: 'The platforms associated with the feature', example: [], required: false })
    platforms!: FeaturePlatform[];

    @OneToMany(() => FeatureCountry, (featureCountry) => featureCountry.feature)
    @ApiProperty({ description: 'The countries associated with the feature', example: [], required: false })
    countries!: FeatureCountry[];
}
