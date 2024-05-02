import { Entity, Column, OneToOne, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { AuthToken } from './auth.token.entity';
import { User } from './user.entity';
import { Platform } from 'src/common/enums/platform.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'sessions' })
export class Session {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the session', example: '12345678-1234-1234-1234-1234567890ab' })
    id!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    @ApiProperty({ description: 'The user associated with the session', example: { id: '123', name: 'John Doe' }, required: true })
    user!: User;

    @OneToOne(() => AuthToken, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'auth_token_id' })
    @ApiProperty({ description: 'The authentication token associated with the session', example: { token: 'abc123' }, required: true })
    authToken!: AuthToken;

    @Column({ enum: Platform, default: Platform.ANDROID })
    @ApiProperty({
        description: 'The platform used for the session',
        example: 'ANDROID',
        enum: Platform,
        enumName: 'Platform',
        required: true,
    })
    platform!: Platform;

    @Column()
    @ApiProperty({ description: 'The location of the session', example: 'New York', required: true })
    location!: string;

    @Column()
    @ApiProperty({ description: 'The device used for the session', example: 'iPhone X', required: true })
    device!: string;

    @Column()
    @ApiProperty({ description: 'The IP address of the session', example: '192.168.0.1', required: true })
    ip!: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    @ApiProperty({ description: 'The date and time when the session was created', example: '2022-01-01T12:00:00Z', required: true })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    @ApiProperty({ description: 'The date and time when the session was last updated', example: '2022-01-01T12:00:00Z', required: true })
    updatedAt!: Date;
}
