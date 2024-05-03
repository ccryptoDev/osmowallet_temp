import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { TierFeature } from './tierFeature.entity';
import { TierUser } from './tierUser.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'tiers' })
export class Tier {
    @ApiProperty({ description: 'The unique identifier of the tier', example: 'c7a9e4e1-3d7b-4e7f-9e8a-2b7d6c5a4b3c', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The name of the tier', example: 'Gold', required: true })
    @Column({ nullable: false })
    name!: string;

    @ApiProperty({ description: 'The users associated with the tier', example: [], required: false })
    @OneToMany(() => TierUser, (tierUser) => tierUser.tier)
    tierUsers!: TierUser[];

    @ApiProperty({ description: 'The features available for the tier', example: [], required: false })
    @OneToMany(() => TierFeature, (tierFeature) => tierFeature.tier)
    tierFeatures!: TierFeature[];
}
