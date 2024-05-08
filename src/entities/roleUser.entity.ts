import { Entity, OneToOne, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'user_roles' })
export class UserRole {
    @ApiProperty({
        description: 'The unique identifier of the user role',
        example: 'c7d9e0f5-4e7d-4e9b-8e5f-2e9e6e4f7d8c',
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The user associated with the role',
        example: { id: 'c7d9e0f5-4e7d-4e9b-8e5f-2e9e6e4f7d8c', name: 'John Doe' },
    })
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The role associated with the user',
        example: { id: 'c7d9e0f5-4e7d-4e9b-8e5f-2e9e6e4f7d8c', name: 'Admin' },
    })
    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'role_id' })
    role!: Role;
}
