import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'nits' })
export class Nit {
    @ApiProperty({
        description: 'The ID of the nit',
        example: '12345678-1234-1234-1234-1234567890ab',
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The user associated with the nit',
        example: { id: '123', name: 'John Doe' },
    })
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The nit value',
        example: '1234567890',
        required: true,
    })
    @Column()
    nit!: string;

    @ApiProperty({
        description: 'The creation date of the nit',
        example: '2022-01-01T00:00:00Z',
    })
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @ApiProperty({
        description: 'The last update date of the nit',
        example: '2022-01-01T00:00:00Z',
    })
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updateAt!: Date;
}
