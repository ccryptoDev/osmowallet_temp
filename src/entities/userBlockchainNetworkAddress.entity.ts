import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";
import { BlockchainNetwork } from "./blockchainNetworks.entity";



@Entity({name: 'blockchain_network_addresses'})
export class BlockchainNetworkAddress {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @ManyToOne(() => User,{onDelete: 'CASCADE', nullable: true})
    @JoinColumn({ name: 'user_id'})
    user: User;

    @ManyToOne(() => BlockchainNetwork, {onDelete: 'CASCADE'})
    network: BlockchainNetwork

    @Column({nullable: false})
    address: string

    @Column({nullable: true})
    stable: string
    
}