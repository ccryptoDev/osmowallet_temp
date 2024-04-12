import { Expose } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn,OneToOne, JoinColumn, ManyToOne, CreateDateColumn, Generated, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { Coin } from './coin.entity';
import { Period } from './period.entity';
import { User } from './user.entity';

@Entity({name:'autoconverts'})
export class Autoconvert {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToOne(type => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @ManyToOne(type => Coin,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'coin_id'})
  coin: Coin

  @Column({name: 'is_active', default: false})
  isActive: boolean

  @Column({default: 100})
  percent: number
  
  @CreateDateColumn({name: 'created_at',type:'timestamp'})
  createdAt: Date

  @UpdateDateColumn({name: 'updated_at',type:'timestamp'})
  updatedAt: Date


}