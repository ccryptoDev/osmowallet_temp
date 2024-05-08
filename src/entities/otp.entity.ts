import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'otp_codes' })
export class Otp {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the OTP code', example: 'c6b7e9a0-8e5b-4e2d-9e9a-5e0e6a7b8c9d', required: true })
    id!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'user_id' })
    @ApiProperty({ description: 'The user associated with the OTP code', required: false })
    user!: User;

    @Column({ nullable: true })
    @ApiProperty({ description: 'The input associated with the OTP code', example: '123456', required: false })
    input!: string;

    @Column()
    @ApiProperty({ description: 'The OTP code', example: 123456, required: true })
    otp!: number;

    @Column({ type: 'varchar', nullable: false })
    @ApiProperty({ description: 'The type of the OTP code', example: 'email', required: true })
    type!: string;

    @Column({ name: 'expiry' })
    @ApiProperty({ description: 'The expiry date of the OTP code', example: '2022-01-01T00:00:00Z', required: true })
    expiry!: Date;
}
