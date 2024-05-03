import { SendGloballyPartner } from 'src/modules/send-globally/enums/partner.enum';
import { SendGloballyStatus } from 'src/modules/send-globally/enums/status.enum';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'global_payments' })
export class GlobalPayment {
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    @ApiProperty({ description: 'The ID of the global payment', example: '12345678', required: true })
    id!: string;

    @Column({ nullable: true })
    @ApiProperty({ description: 'The ID of the quote', example: '98765432', required: false })
    quoteId!: string;

    @Column({ default: 0, type: 'decimal', precision: 15, scale: 3 })
    @ApiProperty({ description: 'The amount of the payment', example: 100.5, required: true })
    amount!: number;

    @Column({ default: 'USD' })
    @ApiProperty({ description: 'The currency of the payment', example: 'USD', required: true })
    currency!: string;

    @Column({ default: 0 })
    @ApiProperty({ description: 'The amount in satoshis', example: 100000000, required: true })
    sats!: number;

    @Column({ length: 1000, nullable: true })
    @ApiProperty({ description: 'The address for the payment', example: '1ABCxyz...', required: false })
    address!: string;

    @Column({ enum: SendGloballyStatus })
    @ApiProperty({ description: 'The status of the payment', example: 'Pending', required: true })
    status!: SendGloballyStatus;

    @Column({ enum: SendGloballyPartner })
    @ApiProperty({ description: 'The partner for the payment', example: 'Partner A', required: true })
    partner!: SendGloballyPartner;

    @Column({ nullable: true })
    @ApiProperty({ description: 'The flow of the payment', example: 'Flow A', required: false })
    flow!: string;

    @Column({ nullable: true })
    @ApiProperty({ description: 'The ID of the payout', example: '87654321', required: false })
    payoutId!: string;
}
