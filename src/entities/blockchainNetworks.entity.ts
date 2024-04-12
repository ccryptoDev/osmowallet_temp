import { Column, Entity, PrimaryColumn } from "typeorm";



@Entity({name: 'blockchain_networks'})
export class BlockchainNetwork{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @Column({nullable: false})
    name: string

    @Column({nullable: false})
    logo: string
    
}