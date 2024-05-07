import { Entity, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { TransactionDetail } from './transaction.detail.entity';
import { TransactionGroup } from './transactionGroup.entity';
import { Wallet } from './wallet.entity';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'transactions' })
export class Transaction {
    @ApiProperty({ example: '1', description: 'The unique identifier of the transaction', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ example: '1', description: 'The wallet associated with the transaction', required: true })
    @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'wallet_id' })
    wallet!: Wallet;

    @ApiProperty({ example: 10.5, description: 'The amount of the transaction', required: true })
    @Column({
        default: 0.0,
        type: 'decimal',
        precision: 15,
        scale: 5,
        transformer: numberTransformer,
    })
    amount!: number;

    @ApiProperty({ example: '1', description: 'The transaction group associated with the transaction', required: true })
    @ManyToOne(() => TransactionGroup, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'transaction_group_id' })
    transactionGroup!: TransactionGroup;

    @ApiProperty({ example: 'subtype', description: 'The subtype of the transaction', required: true })
    @Column({ nullable: false })
    subtype!: string;

    @ApiProperty({ example: 100.0, description: 'The balance after the transaction', required: true })
    @Column({
        default: 0.0,
        type: 'decimal',
        precision: 15,
        scale: 5,
        transformer: numberTransformer,
    })
    balance!: number;

    @ApiProperty({ example: '2022-01-01T00:00:00Z', description: 'The date and time when the transaction was created', required: true })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({
        example: '2022-01-01T00:00:00Z',
        description: 'The date and time when the transaction was last updated',
        required: true,
    })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @ApiProperty({ example: '1', description: 'The transaction detail associated with the transaction', required: true })
    @OneToOne(() => TransactionDetail, (transactionDetail) => transactionDetail.transaction)
    transactionDetail!: TransactionDetail;
}
