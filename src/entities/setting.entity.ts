import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'settings' })
export class Setting {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the setting', example: 'c7e8a3e0-4e0b-4e6d-9e9a-3d0e8f7a6b5c', required: true })
    id!: string;

    @Column()
    @ApiProperty({ description: 'The type of the setting', example: 'string', required: true })
    type!: string;

    @Column()
    @ApiProperty({ description: 'The name of the setting', example: 'setting_name', required: true })
    name!: string;

    @Column()
    @ApiProperty({ description: 'The description of the setting', example: 'This is a setting description', required: true })
    description!: string;

    @Column()
    @ApiProperty({ description: 'The value of the setting', example: 'setting_value', required: true })
    value!: string;
}
