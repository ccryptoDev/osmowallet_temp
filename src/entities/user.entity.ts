import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Verification } from './verification.entity';
import { Address } from './address.entity';
import { UserRole } from './roleUser.entity';
import { Nit } from './bill.entity';
import { UserReferralSource } from './user.referral.source.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Exclude()
  @Column({ nullable: true })
  password: string;

  @Exclude()
  @Column({ nullable: true })
  pin: string;

  @Column({ nullable: true,name: 'is_2fa_enabled',default: false })
  is2FAEnabled: boolean;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: true })
  mobile: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: false })
  residence: string;

  @Column({ name: 'username_changes', default: 0 })
  usernameChanges: number;

  @Column({ name: 'last_session', nullable: true })
  lastSession: Date;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ name: 'profile_picture', nullable: true, length: 1000 })
  profilePicture: string;

  @Column({ name: 'profile_picture_path', nullable: true })
  @Exclude()
  profilePicturePath: string;

  @Column({ name: 'profile_picture_expiry', nullable: true })
  @Exclude()
  profilePictureExpiry: Date;

  @Column({ name: 'hash', nullable: true })
  profileHash: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  //////RELATIONS

  @OneToOne(() => Address, (address) => address.user)
  addresses: Address;

  @OneToOne(() => Verification, (verifcation) => verifcation.user)
  verifications: Verification;

  @OneToOne(() => UserRole, (userRole) => userRole.user)
  userRole: UserRole;

  @OneToOne(() => Nit, (nit) => nit.user)
  nit: Nit;

}
