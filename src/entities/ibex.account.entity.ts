import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'ibex_accounts' })
export class IbexAccount {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the IbexAccount', example: '12345678-1234-1234-1234-1234567890ab', required: true })
    id!: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    @ApiProperty({ description: 'The User associated with the IbexAccount', required: true })
    user!: User;

    @Column()
    @ApiProperty({ description: 'The account number', example: '1234567890', required: true })
    account!: string;

    @Column()
    @ApiProperty({ description: 'The name of the account', example: 'John Doe', required: true })
    name!: string;

    @Column({ name: 'username_id', nullable: true })
    @ApiProperty({ description: 'The ID of the username', example: 'username123', required: false })
    usernameId!: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    @ApiProperty({ description: 'The date and time when the IbexAccount was created', example: '2022-01-01T00:00:00Z', required: true })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    @ApiProperty({
        description: 'The date and time when the IbexAccount was last updated',
        example: '2022-01-01T00:00:00Z',
        required: true,
    })
    updatedAt!: Date;
}
