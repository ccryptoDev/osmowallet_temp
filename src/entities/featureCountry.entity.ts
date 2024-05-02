import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Country } from './country.entity';
import { Feature } from './feature.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'feature_countries' })
export class FeatureCountry {
    @ApiProperty({ description: 'The unique identifier of the feature country', example: '1', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The feature associated with the feature country', example: 'Feature A', required: true })
    @ManyToOne(() => Feature, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'feature_id' })
    feature!: Feature;

    @ApiProperty({ description: 'The country associated with the feature country', example: 'Country A', required: true })
    @ManyToOne(() => Country, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'country_id', referencedColumnName: 'id', foreignKeyConstraintName: 'feature_countries_country_fk' })
    country!: Country;

    @ApiProperty({ description: 'Indicates whether the feature country is active or not', example: true, required: true })
    @Column({ default: true })
    active!: boolean;
}
