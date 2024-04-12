import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Coin } from "./coin.entity";
import { TransactionGroup } from "./transactionGroup.entity";
import { numberTransformer } from "src/common/transformers/decimal.transformer";
import { FeeSource } from "src/common/enums/fee-source.enum";

@Entity({name: 'transaction_fees'})
export class TransactionFee{

    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id: string;

    @Column({default: 0.0, type:'decimal', precision: 15, scale: 3,transformer: numberTransformer})
    amount: number

    @ManyToOne(() => TransactionGroup,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'transaction_group_id'})
    transactionGroup: TransactionGroup

    @ManyToOne(() => Coin,{onDelete: 'CASCADE'})
    @JoinColumn({name: 'coin_id'})
    coin: Coin
    
    @Column({enum: FeeSource, default: FeeSource.OSMO})
    source: FeeSource

}