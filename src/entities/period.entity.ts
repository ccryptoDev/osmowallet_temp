
import { Exclude, Expose } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn, Generated, PrimaryColumn} from 'typeorm';

@Entity({name: 'periods'})
export class Period {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  name: string
}