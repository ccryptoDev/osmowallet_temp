import { ApiProperty } from '@nestjs/swagger';
import { BankAccountType } from 'src/common/enums/bankAccountType.enum';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Bank } from './bank.entity';
import { Coin } from './coin.entity';
import { User } from './user.entity';

@Entity({ name: 'bank_accounts' })
export class BankAccount {
    @ApiProperty({
        description: 'The unique identifier of the bank account',
        example: '1',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The user associated with the bank account',
        example: '1',
        required: true,
    })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The type of bank account',
        example: 'AHORROS',
        required: false,
    })
    @Column({ name: 'account_type', enum: BankAccountType, default: BankAccountType.AHORROS, nullable: true })
    bankAccountType!: BankAccountType;

    @ApiProperty({
        description: 'The account number',
        example: '1234567890',
        required: true,
    })
    @Column({ name: 'account_number' })
    accountNumber!: string;

    @ApiProperty({
        description: 'The account holder',
        example: 'John Doe',
        required: true,
    })
    @Column({ name: 'account_holder' })
    accountHolder!: string;

    @ApiProperty({
        description: 'The coin associated with the bank account',
        example: '1',
        required: true,
    })
    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    coin!: Coin;

    @ApiProperty({
        description: 'The bank associated with the bank account',
        example: '1',
        required: true,
    })
    @ManyToOne(() => Bank, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bank_id' })
    bank!: Bank;

    @ApiProperty({
        description: 'The date and time when the bank account was created',
        example: '2022-01-01T00:00:00Z',
        required: true,
    })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({
        description: 'The date and time when the bank account was last updated',
        example: '2022-01-01T00:00:00Z',
        required: true,
    })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}
