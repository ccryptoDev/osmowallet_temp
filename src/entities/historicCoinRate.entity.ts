import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { HistoricRate } from './historicRates.entity';
import { Coin } from './coin.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'historic_coin_rate' })
export class HistoricCoinRate {
    @ApiProperty({ description: 'The unique identifier of the historic coin rate', example: '1', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The historic rate associated with this coin rate', example: '1', required: true })
    @ManyToOne(() => HistoricRate, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'historic_rate_id' })
    historicRate!: HistoricRate;

    @ApiProperty({ description: 'The coin associated with this coin rate', example: 'BTC', required: true })
    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    coin!: Coin;

    @ApiProperty({ description: 'The exchange rate of the coin', example: 0.5, required: true })
    @Column({ name: 'exchange_rate', type: 'float' })
    exchangeRate!: number;
}
