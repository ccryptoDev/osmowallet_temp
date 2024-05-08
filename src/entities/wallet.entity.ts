import { Entity, Column, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { Account } from './account.entity';
import { Coin } from './coin.entity';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'wallets' })
export class Wallet {
    @ApiProperty({ description: 'The unique identifier of the wallet', example: 'c7a4e6c1-4a6e-4d8b-9e4a-3a2b1c5d6e7f', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The account associated with the wallet', required: true })
    @ManyToOne(() => Account, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'account_id' })
    account!: Account;

    @ApiProperty({ description: 'The coin associated with the wallet', required: true })
    @ManyToOne(() => Coin, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'coin_id' })
    coin!: Coin;

    @ApiProperty({ description: 'The balance of the wallet', example: 100.0, required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 5, transformer: numberTransformer })
    balance!: number;

    @ApiProperty({ description: 'The available balance of the wallet', example: 50.0, required: true })
    @Column({ name: 'available_balance', type: 'decimal', precision: 15, scale: 5, transformer: numberTransformer, default: 0.0 })
    availableBalance!: number;

    @ApiProperty({ description: 'Indicates if the wallet is active', example: true, required: true })
    @Column({ name: 'is_active', default: true })
    isActive!: boolean;

    @ApiProperty({ description: 'The creation date of the wallet', example: '2022-01-01T00:00:00Z', required: true })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({ description: 'The last update date of the wallet', example: '2022-01-01T00:00:00Z', required: true })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}
