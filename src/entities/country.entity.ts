import { Exclude, Expose } from "class-transformer";
import { Column, Entity, Generated, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";


@Entity({name: 'countries'})
export class Country{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @Column({nullable: false})
    name: string

    @Column({nullable: false})
    code: string

    @Column({length: 1000, nullable: true})
    flag: string
  
}