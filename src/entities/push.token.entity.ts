import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { AuthToken } from './auth.token.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'push_tokens' })
export class PushToken {
    @ApiProperty({
        description: 'The unique identifier of the push token',
        example: 'c7e8a6f4-9b3d-4e5f-8a2c-1b2d3e4f5g6h',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The user associated with the push token', example: 'John Doe', required: true })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({ description: 'The authentication token associated with the push token', example: 'abc123', required: true })
    @OneToOne(() => AuthToken, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auth_token_id' })
    authToken!: AuthToken;

    @ApiProperty({ description: 'The token value', example: 'xyz789', required: false })
    @Column({ name: 'token', nullable: true })
    token!: string;

    @ApiProperty({ description: 'The creation date of the push token', example: '2022-01-01T00:00:00Z', required: true })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;
}
