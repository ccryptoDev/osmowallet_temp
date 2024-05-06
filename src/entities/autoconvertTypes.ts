import { Exclude, Expose } from "class-transformer";
import { Column, Entity, Generated, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";


@Entity({name: 'autoconvert_types'})
export class AutoconvertType{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @Column({nullable: false})
    name: string

    @Column({default: 0.0, type: 'float', precision: 15, scale:2})
    min: number

    @Column({default: 0.0, type: 'float', precision: 15, scale:2})
    max: number
  
}