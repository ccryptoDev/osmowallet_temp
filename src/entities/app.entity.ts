
import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn} from 'typeorm';

@Entity({name: 'apps'})
export class App {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({name: 'client_id',unique: true,length:500})
  clientId: string

  @Column({name: 'client_secret',length: 500})
  clientSecret: string

  @Column({name: 'webhook_url',length: 500,nullable: true})
  webhookURL: string

  @Column()
  name: string
}