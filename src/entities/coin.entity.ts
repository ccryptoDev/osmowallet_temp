import { Entity, Column, PrimaryColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'coins' })
export class Coin {
    @ApiProperty({ example: 'c7b9c8f0-3e3e-4e4e-9a9a-5b5b6b7b8b8b', description: 'The unique identifier of the coin' })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ example: 'Bitcoin', description: 'The name of the coin' })
    @Column()
    name!: string;

    @ApiProperty({ example: 'BTC', description: 'The flag of the coin' })
    @Column()
    flag!: string;

    @ApiProperty({ example: 0.001, description: 'The exchange rate of the coin' })
    @Column({ name: 'exchange_rate', type: 'float' })
    exchangeRate!: number;

    @ApiProperty({ example: 'BTC', description: 'The acronym of the coin', uniqueItems: true })
    @Column({ unique: true })
    acronym!: string;

    @ApiProperty({ example: false, description: 'Indicates if the coin is active', default: false })
    @Exclude()
    @Column({ name: 'is_active', default: false })
    isActive!: boolean;
}
