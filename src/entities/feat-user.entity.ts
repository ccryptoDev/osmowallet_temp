import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Feature } from "./feature.entity";
import { User } from "./user.entity";


@Entity({ name: 'user_features' })
export class UserFeature {
    @ApiProperty({
        description: 'The unique identifier of the user feature',
        example: 'c7d9e0f5-4e7d-4e9b-8e5f-2e9e6e4f7d8c',
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The user associated with the feature',
        example: { id: 'c7d9e0f5-4e7d-4e9b-8e5f-2e9e6e4f7d8c', name: 'John Doe' },
    })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The feature associated with the user',
        example: { id: 'c7d9e0f5-4e7d-4e9b-8e5f-2e9e6e4f7d8c', name: 'SWAP' },
    })
    @ManyToOne(() => Feature, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'feature_id' })
    feature!: Feature;

    @ApiProperty({
        description: 'The availability of the feature',
        example: 'true'
    })
    @Column({name: 'is_active', default: true})
    isActive!: boolean
}