import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'blockchain_networks' })
export class BlockchainNetwork {
    @ApiProperty({
        description: 'The unique identifier of the blockchain network',
        example: 'c7b3a0f8-2b5d-4a1e-9e8f-3e4f5a6b7c8d',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The name of the blockchain network',
        example: 'Ethereum',
        required: true,
    })
    @Column({ nullable: false })
    name!: string;

    @ApiProperty({
        description: 'The logo URL of the blockchain network',
        example: 'https://example.com/logo.png',
        required: true,
    })
    @Column({ nullable: false })
    logo!: string;
}
