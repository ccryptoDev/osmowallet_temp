import { Exclude } from 'class-transformer';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { FundingMethod } from './fundingMethod.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'funding_method_coins' })
export class FundingMethodCoin {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the funding method coin', example: '12345678-1234-1234-1234-1234567890ab' })
    id!: string;

    @ManyToOne(() => FundingMethod, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'funding_method_id' })
    @Exclude()
    @ApiProperty({ description: 'The funding method associated with the coin', example: 'FundingMethod', required: true })
    fundingMethod!: FundingMethod;

    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    @ApiProperty({ description: 'The coin associated with the funding method', example: 'Coin', required: true })
    coin!: Coin;
}
