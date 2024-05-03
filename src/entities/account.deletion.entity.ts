import { Status } from 'src/common/enums/status.enum';
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'account_deletions' })
export class AccountDeletion {
    @ApiProperty({
        description: 'The unique identifier of the account deletion',
        example: 'c8a4e9e8-3e9a-4b6d-9a5c-2e8f7d6c5b4a',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The user associated with the account deletion',
        example: { id: 'c8a4e9e8-3e9a-4b6d-9a5c-2e8f7d6c5b4a', name: 'John Doe' },
        required: true,
    })
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The status of the account deletion',
        example: 'PENDING',
        required: true,
    })
    @Column({ enum: Status, default: Status.PENDING })
    status!: Status;

    @ApiProperty({
        description: 'The date and time when the account deletion was created',
        example: '2022-01-01T00:00:00.000Z',
        required: true,
    })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({
        description: 'The date and time when the account deletion was last updated',
        example: '2022-01-01T00:00:00.000Z',
        required: true,
    })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}
