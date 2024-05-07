import { Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { Tier } from './tier.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'tier_users' })
export class TierUser {
    @ApiProperty({ description: 'The unique identifier of the tier user', example: '1', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: number;

    @ApiProperty({ description: 'The user associated with the tier user', example: 'John Doe', required: true })
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({ description: 'The tier associated with the tier user', example: 'Gold', required: true })
    @ManyToOne(() => Tier, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tier_id' })
    tier!: Tier;
}
