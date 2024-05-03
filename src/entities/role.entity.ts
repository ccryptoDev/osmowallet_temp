import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'roles' })
export class Role {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({
        description: 'The unique identifier of the role',
        example: 'c7a5e9e8-4e5f-4a6b-8c9d-1e2f3a4b5c6d',
        required: true,
    })
    id!: string;

    @Column()
    @ApiProperty({
        description: 'The name of the role',
        example: 'admin',
        required: true,
    })
    name!: string;
}
