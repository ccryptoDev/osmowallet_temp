import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'osmo_business_bpts' })
export class OsmoBusinessBpt {
    @ApiProperty({ example: '1', description: 'The unique identifier of the business BPT' })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ example: 'Osmo Business', description: 'The name of the business' })
    @Column({ name: 'name' })
    name!: string;

    @ApiProperty({ example: 'BPT', description: 'The BPT name' })
    @Column({ name: 'bpt_name' })
    bptName!: string;

    @ApiProperty({ example: 'https://example.com', description: 'The URL of the business' })
    @Column({ name: 'bpt_url' })
    url!: string;

    @ApiProperty({ example: 'logo.png', description: 'The logo of the business', required: false })
    @Column({ length: 1000, nullable: true })
    logo!: string;

    @Exclude()
    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt!: Date;

    @Exclude()
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;
}
