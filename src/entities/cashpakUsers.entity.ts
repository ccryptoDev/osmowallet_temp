import { Exclude } from 'class-transformer';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'cashpak_users' })
export class CashpakUser {
    @ApiProperty({
        description: 'The ID of the cashpak user',
        example: '12345678',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The ID of the customer',
        example: '98765432',
        required: true,
    })
    @Column()
    customerId!: string;

    @ApiProperty({
        description: 'The token for authentication',
        example: 'abc123',
        required: true,
    })
    @Column({ type: 'text' })
    @Exclude()
    token!: string;

    @ApiProperty({
        description: 'The associated user',
        example: { id: 'user123', name: 'John Doe' },
        required: true,
    })
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({
        description: 'The expiry date',
        example: '2022-12-31',
        required: true,
    })
    @Column()
    expiry!: Date;

    @Column()
    @ApiProperty({ description: 'The phone number', example: '1234567890', required: true })
    phone!: string;
}
