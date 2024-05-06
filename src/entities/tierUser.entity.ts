import { Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { Tier } from './tier.entity';
import { User } from './user.entity';

@Entity({name: 'tier_users'})
export class TierUser {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: number;

    @OneToOne(() => User,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'user_id'})
    user: User

    @ManyToOne(() => Tier,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'tier_id'})
    tier: Tier
}