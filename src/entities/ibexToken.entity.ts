import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({name:'ibex_tokens'})
export class IbexToken {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({name: 'access_token',type: 'text'})
  accessToken: string

  @Column({name: 'refresh_token',type: 'text'})
  refreshToken: string
}