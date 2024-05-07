import { CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { HistoricCoinRate } from './historicCoinRate.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'historic_rate' })
export class HistoricRate {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the historic rate', example: 'c7d6e9a1-8e1f-4e6a-9f2a-3e8f7d6c5b4a', required: true })
    id!: string;

    @OneToMany(() => HistoricCoinRate, (historicCoinRate) => historicCoinRate.historicRate)
    @ApiProperty({ description: 'The historic coin rates associated with this historic rate', required: true })
    historicCoinRate!: HistoricCoinRate[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    @ApiProperty({ description: 'The date and time when the historic rate was created', example: '2022-01-01T12:00:00Z', required: true })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    @ApiProperty({
        description: 'The date and time when the historic rate was last updated',
        example: '2022-01-02T12:00:00Z',
        required: true,
    })
    updatedAt!: Date;
}
