import { AccountType } from 'src/common/enums/accountType.enum';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'accounts' })
export class Account {
    @ApiProperty({
        description: 'The unique identifier of the account',
        example: 'c7e9a6d1-5a7b-4e3c-8f9d-2e1f0b3d4c5e',
    })
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ApiProperty({
        description: 'The user associated with the account',
        example: 'All data of user',
    })
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The type of the account',
        example: 'INDIVIDUAL',
    })
    @Column({ name: 'account_type', enum: AccountType, default: AccountType.INDIVIDUAL })
    accountType!: AccountType;

    @ApiProperty({
        description: 'The alias of the account',
        example: 'My Account',
        required: false,
    })
    @Column({ nullable: true })
    alias!: string;
}
