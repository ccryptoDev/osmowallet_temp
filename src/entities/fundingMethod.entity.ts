import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { CountryFunding } from './countryFunding.entity';
import { FundingMethodCoin } from './fundingMethodCoin.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'funding_methods' })
export class FundingMethod {
    @ApiProperty({ example: '1', description: 'The unique identifier of the funding method', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ example: 'Credit Card', description: 'The name of the funding method', required: true })
    @Column({ nullable: false })
    name!: string;

    @ApiProperty({ example: 0.0, description: 'The minimum amount allowed for the funding method', required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    min!: number;

    @ApiProperty({ example: 1000.0, description: 'The maximum amount allowed for the funding method', required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    max!: number;

    @ApiProperty({ example: 0.01, description: 'The fee percentage for the funding method', required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 3, transformer: numberTransformer })
    fee!: number;

    @ApiProperty({ example: true, description: 'Indicates if the funding method is active', required: true })
    @Column({ default: true })
    isActive!: boolean;

    @ApiProperty({ example: 'Credit Card', description: 'The title of the funding method', required: true })
    @Column({ nullable: false, default: 'TITLE' })
    title!: string;

    @ApiProperty({ example: 'This is a funding method', description: 'The description of the funding method', required: true })
    @Column({ nullable: false })
    description!: string;

    @ApiProperty({ example: 'Immediate', description: 'The estimated time for the funding method', required: true })
    @Column({ name: 'estimate_time', default: 'Immediate' })
    estimateTime!: string;

    @ApiProperty({ description: 'The available coins for the funding method', required: true })
    @OneToMany(() => FundingMethodCoin, (fundingMethodCoin) => fundingMethodCoin.fundingMethod)
    availableCoins!: FundingMethodCoin[];

    @ApiProperty({ description: 'The countries where the funding method is available', required: true })
    @OneToMany(() => CountryFunding, (country) => country.fundingMethod)
    countries!: CountryFunding;
}
