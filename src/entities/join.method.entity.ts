import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'coins'})
export class JoinMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  method: string

}