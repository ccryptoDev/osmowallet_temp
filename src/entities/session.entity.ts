


import { Entity, Column,OneToOne, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { AuthToken } from './auth.token.entity';
import { User } from './user.entity';
import { Platform } from 'src/common/enums/platform.enum';

@Entity({name: 'sessions'})
export class Session {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(() => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @OneToOne(() => AuthToken,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'auth_token_id'})
  authToken: AuthToken

  @Column({enum: Platform,default: Platform.ANDROID})
  platform: Platform

  @Column()
  location: string

  @Column()
  device: string

  @Column()
  ip: string

  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date;

  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updatedAt: Date;
}