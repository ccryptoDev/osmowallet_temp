import { Exclude } from 'class-transformer';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { WithdrawalMethod } from './withdrawalMethod.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'withdrawal_method_coins' })
export class WithdrawalMethodCoin {
    @ApiProperty({ example: 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6', description: 'The unique identifier of the withdrawal method coin.' })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        example: 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
        description: 'The unique identifier of the withdrawal method associated with this coin.',
    })
    @ManyToOne(() => WithdrawalMethod, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'withdrawal_method_id' })
    @Exclude()
    withdrawalMethod!: WithdrawalMethod;

    @ApiProperty({
        example: 'c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6',
        description: 'The unique identifier of the coin associated with this withdrawal method.',
    })
    @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'coin_id' })
    coin!: Coin;
}
