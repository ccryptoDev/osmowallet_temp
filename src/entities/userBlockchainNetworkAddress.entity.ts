import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { BlockchainNetwork } from './blockchainNetworks.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'blockchain_network_addresses' })
export class BlockchainNetworkAddress {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The unique identifier of the network address', example: 'c9a1e8e0-4f8e-4e3d-9e7a-8e1e3c2b1a0b' })
    id!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'user_id' })
    @ApiProperty({ description: 'The user associated with the network address', example: { id: '123', name: 'John Doe' }, required: false })
    user!: User;

    @ManyToOne(() => BlockchainNetwork, { onDelete: 'CASCADE' })
    @ApiProperty({
        description: 'The blockchain network associated with the network address',
        example: { id: '456', name: 'Ethereum' },
        required: true,
    })
    network!: BlockchainNetwork;

    @Column({ nullable: false })
    @ApiProperty({ description: 'The address of the network', example: '0x1234567890abcdef', required: true })
    address!: string;

    @Column({ nullable: true })
    @ApiProperty({ description: 'The stable version of the network', example: '1.0.0', required: false })
    stable!: string;
}
