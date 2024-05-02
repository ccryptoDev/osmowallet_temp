import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Country } from './country.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'banks' })
export class Bank {
    @ApiProperty({
        description: 'The ID of the bank',
        example: '12345678',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The name of the bank',
        example: 'Bank of Example',
        required: true,
    })
    @Column()
    name!: string;

    @ApiProperty({
        description: 'The code of the bank',
        example: 1234,
        required: false,
    })
    @Column({ name: 'code', default: 0 })
    code!: number;

    @ApiProperty({
        description: 'The country of the bank',
        example: { id: 'countryId', name: 'Country Name' },
        required: true,
    })
    @ManyToOne(() => Country, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'country_id', referencedColumnName: 'id', foreignKeyConstraintName: 'banks_country_fk' })
    country!: Country;
}
