import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'autoconvert_types' })
export class AutoconvertType {
    @ApiProperty({
        description: 'The unique identifier of the autoconvert type',
        example: 'c4e8e0e2-8e5e-4e4d-9e6e-3e8e7e6e5e4e',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The name of the autoconvert type',
        example: 'Type A',
        required: true,
    })
    @Column({ nullable: false })
    name!: string;

    @ApiProperty({
        description: 'The minimum value of the autoconvert type',
        example: 0.0,
        required: false,
    })
    @Column({ default: 0.0, type: 'float', precision: 15, scale: 2 })
    min!: number;

    @ApiProperty({
        description: 'The maximum value of the autoconvert type',
        example: 10.0,
        required: false,
    })
    @Column({ default: 0.0, type: 'float', precision: 15, scale: 2 })
    max!: number;
}
