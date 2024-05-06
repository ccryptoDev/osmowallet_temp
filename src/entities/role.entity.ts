import { Expose } from 'class-transformer';
import { Entity, Column, PrimaryGeneratedColumn, Generated, PrimaryColumn} from 'typeorm';


@Entity({name: 'roles'})
export class Role {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column()
  name: string
}