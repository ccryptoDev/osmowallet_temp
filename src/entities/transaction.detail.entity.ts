import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Transaction } from './transaction.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'transaction_details' })
export class TransactionDetail {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the transaction detail', example: '12345678-1234-1234-1234-1234567890ab' })
    id!: string;

    @OneToOne(() => Transaction, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'transaction_id' })
    @ApiProperty({ description: 'The transaction associated with the detail', example: { id: '12345678-1234-1234-1234-1234567890ab' } })
    transaction!: Transaction;

    @Column({ name: 'ibex_transaction_id', nullable: true })
    @ApiProperty({ description: 'The IBEX transaction ID', example: 'IBEX12345678' })
    ibexTransactionId!: string;

    @Column({ length: 1000, nullable: true })
    @ApiProperty({ description: 'The address', example: '123 Main St' })
    address!: string;

    @Column({ name: 'proof', nullable: true, length: 1000 })
    @ApiProperty({ description: 'The proof URL', example: 'https://example.com/proof' })
    proofUrl!: string;

    @Column({ name: 'proof_path', nullable: true })
    @Exclude()
    proofPath!: string;

    @Column({ name: 'proof_expiry', nullable: true })
    @Exclude()
    proofExpiry!: Date;

    @Column({ type: 'simple-json', nullable: true })
    @ApiProperty({ description: 'The metadata', example: { key: 'value' } })
    metadata!: object;
}
