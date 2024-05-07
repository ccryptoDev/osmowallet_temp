import { Entity, Column, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Wallet } from './wallet.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'wallet_history' })
export class WalletHistory {
    @ApiProperty({ example: '1', description: 'The unique identifier of the wallet history', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ example: '1', description: 'The wallet associated with the wallet history', required: true })
    @ManyToOne(() => Wallet, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'wallet_id' })
    wallet!: Wallet;

    @ApiProperty({ example: 100.0, description: 'The balance of the wallet history', required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 5, transformer: numberTransformer })
    balance!: number;

    @ApiProperty({ example: 100.0, description: 'The available balance of the wallet history', required: true })
    @Column({ name: 'available_balance', type: 'decimal', precision: 15, scale: 5, transformer: numberTransformer, default: 0.0 })
    availableBalance!: number;

    @ApiProperty({ example: '2022-01-01T00:00:00Z', description: 'The creation date of the wallet history', required: true })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({ example: '2022-01-01T00:00:00Z', description: 'The last update date of the wallet history', required: true })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @ApiProperty({ example: '2022-01-01T00:00:00Z', description: 'The date of the wallet history', required: true })
    @Column({ type: 'timestamp' })
    date!: Date;
}
