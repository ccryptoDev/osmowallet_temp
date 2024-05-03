import { numberTransformer } from 'src/common/transformers/decimal.transformer';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { CountryWithdraw } from './countryWithdraw.entity';
import { WithdrawalMethodCoin } from './withdrawalMethodCoin.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'withdrawal_methods' })
export class WithdrawalMethod {
    @ApiProperty({ example: '1', description: 'The unique identifier of the withdrawal method', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ example: 'Bank Transfer', description: 'The name of the withdrawal method', required: true })
    @Column({ nullable: false })
    name!: string;

    @ApiProperty({ example: 0.0, description: 'The minimum withdrawal amount', required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    min!: number;

    @ApiProperty({ example: 1000.0, description: 'The maximum withdrawal amount', required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 2, transformer: numberTransformer })
    max!: number;

    @ApiProperty({ example: 10.0, description: 'The withdrawal fee', required: true })
    @Column({ default: 0.0, type: 'decimal', precision: 15, scale: 3, transformer: numberTransformer })
    fee!: number;

    @ApiProperty({ example: true, description: 'Indicates if the withdrawal method is active', required: true })
    @Column({ default: true })
    isActive!: boolean;

    @ApiProperty({ example: 'Bank Transfer', description: 'The title of the withdrawal method', required: true })
    @Column({ nullable: false, default: 'TITLE' })
    title!: string;

    @ApiProperty({ example: 'Withdraw funds using bank transfer', description: 'The description of the withdrawal method', required: true })
    @Column({ nullable: false })
    description!: string;

    @ApiProperty({ example: 'Immediate', description: 'The estimated time for the withdrawal to be processed', required: true })
    @Column({ nullable: true, default: 'Immediate' })
    estimateTime!: string;

    @ApiProperty({ example: [], description: 'The available coins for withdrawal', required: true })
    @OneToMany(() => WithdrawalMethodCoin, (withdrawalMethodCoin) => withdrawalMethodCoin.withdrawalMethod)
    availableCoins!: WithdrawalMethodCoin[];

    @ApiProperty({ example: [], description: 'The countries where the withdrawal method is available', required: true })
    @OneToMany(() => CountryWithdraw, (country) => country.withdrawlMethod)
    countries!: CountryWithdraw[];
}
