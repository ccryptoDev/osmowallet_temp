import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { TransactionGroup } from './transactionGroup.entity';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { FeeSource } from 'src/common/enums/fee-source.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'transaction_fees' })
export class TransactionFee {
    @ApiProperty({
        description: 'The unique identifier of the transaction fee',
        example: 'c7b9a6e1-8d8e-4e5f-9b6a-3e4f5d6c7b8a',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The amount of the transaction fee', example: 10.5, required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 3, transformer: numberTransformer })
    amount!: number;

    @ApiProperty({
        description: 'The transaction group associated with the transaction fee',
        example: 'transactionGroupId',
        required: true,
    })
    @ManyToOne(() => TransactionGroup, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'transaction_group_id' })
    transactionGroup!: TransactionGroup;

    @ApiProperty({ description: 'The coin associated with the transaction fee', example: 'coinId', required: true })
    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    coin!: Coin;

    @ApiProperty({ description: 'The source of the transaction fee', enum: FeeSource, example: 'OSMO', required: true })
    @Column({ enum: FeeSource, default: FeeSource.OSMO })
    source!: FeeSource;
}
