
import { Exclude, Expose } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn,ManyToOne,ManyToMany, JoinColumn,UpdateDateColumn,CreateDateColumn, Generated, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({name: 'recent_contacts'})
export class RecentContact {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @ManyToOne(type => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @ManyToOne(type => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'contact_id'})
  contact: User

  @Column({name: 'updated_at'})
  updatedAt: Date

}