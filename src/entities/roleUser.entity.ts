import {
  Entity,
  OneToOne,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity({ name: 'user_roles' })
export class UserRole {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
