


import { Entity, Column, PrimaryGeneratedColumn,OneToOne, JoinColumn, Generated, PrimaryColumn, ManyToOne } from 'typeorm';
import { Exclude, Expose } from "class-transformer";
import { Country } from './country.entity';

@Entity({name: 'banks'})
export class Bank {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  name: string

  @Column({name: 'code', default: 0})
  code: number

  @ManyToOne(type => Country,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'country_id', referencedColumnName: 'id', foreignKeyConstraintName: 'banks_country_fk'})
  country: Country

}