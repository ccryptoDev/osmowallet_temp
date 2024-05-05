
import { Exclude, Expose } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn,OneToOne, JoinColumn, Generated, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({name: 'nits'})
export class Nit {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToOne(type => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @Column()
  nit: string

  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date

  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updateAt: Date

}