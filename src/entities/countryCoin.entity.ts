import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'country_coins' })
export class CountryCoin {
    @ApiProperty({
        description: 'The unique identifier of the country coin',
        example: 'c7b9e5e1-6e6d-4e4f-9e9e-1e1e1e1e1e1e',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The associated coin', required: true })
    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    coin!: Coin;

    @ApiProperty({ description: 'The country code', example: 'GT', required: true })
    @Column({ name: 'country_code', default: 'GT' })
    countryCode!: string;
}
