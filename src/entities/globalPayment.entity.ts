import { SendGloballyPartner } from "src/modules/send-globally/enums/partner.enum";
import { SendGloballyStatus } from "src/modules/send-globally/enums/status.enum";
import { Column, Entity, PrimaryColumn } from "typeorm";



@Entity({name: 'global_payments'})
export class GlobalPayment{
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @Column({nullable: true})
    quoteId: string;

    @Column({default: 0, type: 'decimal', precision: 15, scale: 3})
    amount: number

    @Column({default: 'USD'})
    currency: string

    @Column({default: 0})
    sats: number

    @Column({length: 1000, nullable: true})
    address: string

    @Column({enum: SendGloballyStatus})
    status: SendGloballyStatus

    @Column({enum: SendGloballyPartner})
    partner: SendGloballyPartner

    @Column({nullable: true})
    flow: string

    @Column({nullable: true})
    payoutId: string
}