import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'recent_contacts' })
export class RecentContact {
    @ApiProperty({
        description: 'The unique identifier of the recent contact',
        example: 'e7d9a8c0-7b9e-4b7d-9e3a-2e8f6d5c4b3a',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The user associated with the recent contact',
        example: {
            id: 'c4b3a2e8-f6d5-4b7d-9e3a-7b9e8c0e7d9a',
            name: 'John Doe',
        },
        required: true,
    })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The contact associated with the recent contact',
        example: {
            id: '9e3a2e8f-6d5c-4b7d-7b9e-c0e7d9a8c0e7',
            name: 'Jane Smith',
        },
        required: true,
    })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'contact_id' })
    contact!: User;

    @ApiProperty({
        description: 'The date and time when the recent contact was last updated',
        example: '2022-01-01T12:00:00Z',
        required: true,
    })
    @Column({ name: 'updated_at' })
    updatedAt!: Date;
}
