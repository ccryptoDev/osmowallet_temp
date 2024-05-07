import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'countries' })
export class Country {
    @ApiProperty({ description: 'The unique identifier of the country', example: 'c4a2e9e0-8e3a-4e8d-9a4b-2e5e3f1d6c7b', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ description: 'The name of the country', example: 'United States', required: true })
    @Column({ nullable: false })
    name!: string;

    @ApiProperty({ description: 'The code of the country', example: 'US', required: true })
    @Column({ nullable: false })
    code!: string;

    @ApiProperty({ description: 'The flag of the country', example: 'https://example.com/flag.png', required: false })
    @Column({ length: 1000, nullable: true })
    flag!: string;
}
