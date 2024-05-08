import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'periods' })
export class Period {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({
        description: 'The unique identifier of the period',
        example: 'c4a7e8f3-9b6d-4a2f-8e7b-1a9d3b5c2e1f',
    })
    id!: string;

    @Column()
    @ApiProperty({
        description: 'The name of the period',
        example: 'Q3 2022',
        required: true,
    })
    name!: string;
}
