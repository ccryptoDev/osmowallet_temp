
import { Expose } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn,OneToOne, JoinColumn, ManyToOne, CreateDateColumn, Generated, PrimaryColumn } from 'typeorm';
import { AuthToken } from './auth.token.entity';
import { User } from './user.entity';

@Entity({name: 'push_tokens'})
export class PushToken {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(type => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @OneToOne(type => AuthToken,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'auth_token_id'})
  authToken: AuthToken

  @Column({name: 'token',nullable: true})
  token: string

  @CreateDateColumn({name: 'created_at',type: 'timestamp'})
  createdAt: Date;
}