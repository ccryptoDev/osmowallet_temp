import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { WithdrawalMethod } from './withdrawalMethod.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'country_withdraws' })
export class CountryWithdraw {
    @ApiProperty({
        description: 'The unique identifier of the country withdraw',
        example: 'c7d4e8a0-3e7a-4b6f-9e6a-1e9e8d7c6b5a',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The withdrawal method associated with the country withdraw', example: 'WithdrawalMethod', required: true })
    @ManyToOne(() => WithdrawalMethod, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'withdraw_id' })
    withdrawlMethod!: WithdrawalMethod;

    @ApiProperty({ description: 'The country code of the country withdraw', example: 'GT', required: false })
    @Column({ name: 'country_code', default: 'GT' })
    countryCode!: string;

    @ApiProperty({ description: 'Indicates if the country withdraw is active', example: true, required: false })
    @Column({ name: 'is_active', default: true })
    isActive!: boolean;
}
