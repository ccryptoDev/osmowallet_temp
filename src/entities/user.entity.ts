import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Verification } from './verification.entity';
import { Exclude } from 'class-transformer';
import { Address } from './address.entity';
import { UserRole } from './roleUser.entity';
import { Nit } from './bill.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ description: 'The unique identifier of the user.' })
    id!: string;

    @Column({ unique: true, nullable: true })
    @ApiProperty({ description: 'The email address of the user.', example: 'example@example.com', required: false })
    email!: string;

    @Exclude()
    @Column({ nullable: true })
    @ApiProperty({ description: 'The password of the user.', required: false })
    password!: string;

    @Exclude()
    @Column({ nullable: true, type: 'varchar'})
    pin?: string | null;

    @Column({ nullable: true, name: 'is_2fa_enabled', default: false })
    @ApiProperty({ description: 'Indicates whether 2FA is enabled for the user.', example: false, required: false })
    is2FAEnabled!: boolean;

    @Column({ unique: true, nullable: true })
    @ApiProperty({ description: 'The username of the user.', example: 'john_doe', required: false })
    username!: string;

    @Column({ name: 'first_name', nullable: true })
    @ApiProperty({ description: 'The first name of the user.', example: 'John', required: false })
    firstName!: string;

    @Column({ name: 'last_name', nullable: true })
    @ApiProperty({ description: 'The last name of the user.', example: 'Doe', required: false })
    lastName!: string;

    @Column({ unique: true, nullable: true })
    @ApiProperty({ description: 'The mobile number of the user.', example: '1234567890', required: false })
    mobile!: string;

    @Column({ nullable: true })
    @ApiProperty({ description: 'The nationality of the user.', example: 'USA', required: false })
    nationality!: string;

    @Column({ nullable: false })
    @ApiProperty({ description: 'The residence of the user.', example: 'New York', required: true })
    residence!: string;

    @Column({ name: 'username_changes', default: 0 })
    @ApiProperty({ description: 'The number of times the username has been changed.', example: 0, required: false })
    usernameChanges!: number;

    @Column({ name: 'last_session', nullable: true })
    @ApiProperty({ description: 'The date and time of the last session.', example: '2022-01-01T00:00:00Z', required: false })
    lastSession!: Date;

    @Column({ default: true, name: 'is_active' })
    @ApiProperty({ description: 'Indicates whether the user is active.', example: true, required: false })
    isActive!: boolean;

    @Column({ name: 'profile_picture', nullable: true, length: 1000 })
    @ApiProperty({ description: 'The profile picture of the user.', example: 'https://example.com/profile.jpg', required: false })
    profilePicture!: string;

    @Column({ name: 'profile_picture_path', nullable: true })
    @Exclude()
    profilePicturePath!: string;

    @Column({ name: 'profile_picture_expiry', nullable: true })
    @Exclude()
    profilePictureExpiry!: Date;

    @Column({ name: 'hash', nullable: true })
    @ApiProperty({ description: 'The hash of the user profile.', required: false })
    profileHash!: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    @ApiProperty({ description: 'The date and time when the user was created.', example: '2022-01-01T00:00:00Z', required: false })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    @ApiProperty({ description: 'The date and time when the user was last updated.', example: '2022-01-01T00:00:00Z', required: false })
    updatedAt!: Date;

    //////RELATIONS

    @OneToOne(() => Address, (address) => address.user)
    addresses!: Address;

    @OneToOne(() => Verification, (verifcation) => verifcation.user)
    verifications!: Verification;

    @OneToOne(() => UserRole, (userRole) => userRole.user)
    userRole!: UserRole;

    @OneToOne(() => Nit, (nit) => nit.user)
    nit!: Nit;
}
