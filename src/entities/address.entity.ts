import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'addresses' })
export class Address {
    @ApiProperty({
        description: 'The unique identifier of the address',
        example: 'c7b9e3f4-8e9a-4a0e-9e0d-3e8c4f5b2d1a',
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The user associated with the address',
        example: { id: 'c7b9e3f4-8e9a-4a0e-9e0d-3e8c4f5b2d1a', name: 'John Doe' },
        required: true,
    })
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The LN (Lightning Network) address',
        example: 'ln1234567890',
        required: true,
    })
    @Column()
    ln!: string;

    @ApiProperty({
        description: 'The on-chain address',
        example: '0x1234567890abcdef',
        required: true,
    })
    @Column({ name: 'onchain' })
    onChain!: string;

    @ApiProperty({
        description: 'The LNURL payer address',
        example: 'lnurlpayer123456',
        required: false,
    })
    @Exclude()
    @Column({ name: 'lnurl_payer' })
    lnUrlPayer!: string;
}
