import { ApiProperty } from '@nestjs/swagger';
import { BankAccountType } from 'src/common/enums/bankAccountType.enum';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Bank } from './bank.entity';
import { Coin } from './coin.entity';

@Entity({ name: 'osmo_bank_accounts' })
export class OsmoBankAccount {
    @ApiProperty({
        example: 'c7d8e9f0-1234-5678-9abc-def012345678',
        description: 'The unique identifier of the bank account',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        enum: BankAccountType,
        default: BankAccountType.CORRIENTE,
        nullable: true,
        description: 'The type of bank account',
        required: false,
    })
    @Column({ name: 'account_type', enum: BankAccountType, default: BankAccountType.CORRIENTE, nullable: true })
    bankAccountType!: BankAccountType;

    @ApiProperty({ example: '1234567890', description: 'The account number', required: true })
    @Column({ name: 'account_number' })
    accountNumber!: string;

    @ApiProperty({ example: 'John Doe', description: 'The account name', required: true })
    @Column({ name: 'account_name' })
    accountName!: string;

    @ApiProperty({ description: 'The associated coin', required: true })
    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    coin!: Coin;

    @ApiProperty({ description: 'The associated bank', required: true })
    @ManyToOne(() => Bank, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bank_id' })
    bank!: Bank;

    @ApiProperty({ description: 'The creation date of the bank account', required: true })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({ description: 'The last update date of the bank account', required: true })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}
