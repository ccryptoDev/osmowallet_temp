import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'osmo_business_bpts' })
export class OsmoBusinessBpt {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'bpt_name' })
  bptName: string;

  @Column({ name: 'bpt_url' })
  url: string;

  @Column({ length: 1000, nullable: true })
  logo: string;

  @Exclude()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
