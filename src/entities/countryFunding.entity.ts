import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { FundingMethod } from './fundingMethod.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'country_fundings' })
export class CountryFunding {
    @ApiProperty({
        description: 'The unique identifier of the country funding',
        example: 'c7d1a7e1-5a1e-4c8b-9e5a-2e0e7d3f4b6a',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The funding method associated with the country funding', example: 'FundingMethod', required: true })
    @ManyToOne(() => FundingMethod, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'funding_id' })
    fundingMethod!: FundingMethod;

    @ApiProperty({ description: 'The country code of the country funding', example: 'GT', required: true })
    @Column({ name: 'country_code', default: 'GT' })
    countryCode!: string;

    @ApiProperty({ description: 'Indicates whether the country funding is active', example: true, required: true })
    @Column({ name: 'is_active', default: true })
    isActive!: boolean;
}
