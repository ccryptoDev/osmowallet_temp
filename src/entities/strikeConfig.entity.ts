import { Exclude } from "class-transformer";
import { numberTransformer } from "src/common/transformers/decimal.transformer";
import { Column, Entity, Generated, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";


@Entity({name: 'partner_config'})
export class PartnerConfig{

    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @Column({default: 0,nullable: false})
    min: number

    @Column({default: 0, nullable: false})
    max: number

    @Column({name: 'normal_fee',default: 0, nullable: false,type: 'decimal', precision: 15, scale: 3,transformer: numberTransformer})
    normalFee: number

    @Column({name: 'withdraw_fee',default: 0, nullable: false,type: 'decimal',precision: 15, scale: 3,transformer: numberTransformer})
    withdrawFee: number
}