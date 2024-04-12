import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";



@Entity({name: 'transaction_categories'})
export class TransactionCategory {
    
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @Column()
    name: string

    @Column({default: 61449})
    icon: number

    @Column({default: '#FF779ECB'})
    color: string
    
    @ManyToOne(type => User,{onDelete: 'CASCADE', nullable: true})
    @JoinColumn({name: 'from_user_id'})
    user: User

}