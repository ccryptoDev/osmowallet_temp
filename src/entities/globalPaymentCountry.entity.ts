import { Partner } from 'src/common/enums/partner.enum';
import { SendGloballyPartner } from 'src/modules/send-globally/enums/partner.enum';
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Country } from './country.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'global_payment_countries' })
export class GlobalPaymentCountry {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the global payment country', example: '12345678', required: true })
    id!: string;

    @Column({ name: 'is_active', default: true })
    @ApiProperty({ description: 'Indicates if the global payment country is active', example: true, required: true })
    isActive!: boolean;

    @OneToOne(() => Country, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'country_id', referencedColumnName: 'id', foreignKeyConstraintName: 'global_payment_countries_country_fk' })
    @ApiProperty({ description: 'The country associated with the global payment country', required: true })
    country!: Country;

    @Column({ enum: SendGloballyPartner })
    @ApiProperty({ description: 'The partner associated with the global payment country', example: 'partner', required: true })
    partner!: Partner;
}
