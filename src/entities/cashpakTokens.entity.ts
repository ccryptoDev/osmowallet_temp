import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity({name:'cashpak_tokens'})
export class CashpakToken {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({name: 'access_token',type: 'text'})
  accessToken: string
}