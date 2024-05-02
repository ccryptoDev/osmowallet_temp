import { ApiProperty } from '@nestjs/swagger';
import { Partner } from 'src/common/enums/partner.enum';
import { Status } from 'src/common/enums/status.enum';
import { TransactionType } from 'src/common/enums/transactionsType.enum';
import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { HistoricRate } from './historicRates.entity';
import { OsmoBusinessBpt } from './osmoBusinessBPT.entity';
import { Transaction } from './transaction.entity';
import { TransactionCategory } from './transactionCategory.entity';
import { TransactionFee } from './transactionFee.entity';
import { User } from './user.entity';
import { Referral } from './referral.entity';

@Entity({ name: 'transaction_groups' })
export class TransactionGroup {
    @ApiProperty({
        example: 'c4a6e8e5-9e3d-4a7b-8f9c-2e1d0f3b6a5b',
        description: 'The unique identifier of the transaction group',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ enum: TransactionType, description: 'The type of the transaction', required: true })
    @Column({ enum: TransactionType, nullable: true })
    type!: TransactionType;

    @ApiProperty({ enum: Status, example: 'PENDING', description: 'The status of the transaction group', required: true })
    @Column({ enum: Status, default: Status.PENDING })
    status!: Status;

    @ApiProperty({ description: 'The category of the transaction', required: false })
    @ManyToOne(() => TransactionCategory, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'transaction_category_id' })
    category!: TransactionCategory;

    @ApiProperty({ description: 'The coin used in the transaction', required: true })
    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'transaction_coin_id' })
    transactionCoin!: Coin;

    @ApiProperty({ example: 0.001, description: 'The price of the transaction in BTC', required: false })
    @Column({
        name: 'btc_price',
        nullable: true,
        type: 'decimal',
        precision: 15,
        scale: 2,
        transformer: numberTransformer,
    })
    btcPrice!: number;

    @ApiProperty({ description: 'The user who initiated the transaction', required: false })
    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'from_user_id' })
    fromUser!: User;

    @ApiProperty({ description: 'The user who received the transaction', required: false })
    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'to_user_id' })
    toUser!: User;

    @ApiProperty({ description: 'The referral associated with the transaction group', required: false })
    @OneToOne(() => Referral, (referral) => referral.transactionGroup)
    referral!: Referral;

    @ApiProperty({ example: 'This is a note', description: 'A note for the transaction group', required: false })
    @Column({ nullable: true })
    note!: string;

    @ApiProperty({ enum: Partner, description: 'The partner associated with the transaction group', required: false })
    @Column({ enum: Partner, nullable: true })
    partner!: Partner;

    @ApiProperty({ description: 'The method used for the transaction', required: false })
    @Column({ type: 'varchar', nullable: true })
    method!: string;

    @ApiProperty({ description: 'Additional metadata for the transaction group', required: false })
    @Column({ type: 'simple-json', nullable: true })
    metadata!: object;

    @ApiProperty({ format: 'date-time', description: 'The date and time when the transaction group was created', required: true })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({ format: 'date-time', description: 'The date and time when the transaction group was last updated', required: true })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @ApiProperty({ description: 'The transactions associated with the transaction group', required: true })
    @OneToMany(() => Transaction, (transaction) => transaction.transactionGroup)
    transactions!: Transaction[];

    @ApiProperty({ description: 'The fees associated with the transaction group', required: true })
    @OneToMany(() => TransactionFee, (fee) => fee.transactionGroup)
    fees!: TransactionFee[];

    @ApiProperty({ description: 'The historic rate associated with the transaction group', required: true })
    @ManyToOne(() => HistoricRate, { onDelete: 'CASCADE' })
    historicRate!: HistoricRate;

    @ApiProperty({ description: 'The Osmo Business BPT associated with the transaction group', required: false })
    @ManyToOne(() => OsmoBusinessBpt, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'osmo_bussiness_id' })
    osmoBusiness!: OsmoBusinessBpt;
}
