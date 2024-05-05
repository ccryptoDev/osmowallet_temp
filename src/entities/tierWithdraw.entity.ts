

// import { Exclude, Expose } from "class-transformer";
// import { Column, Entity, Generated, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
// import { Tier } from "./tier.entity";
// import { WithdrawalMethod } from "./withdrawalMethod.entity";
// import { numberTransformer } from "src/common/transformers/decimal.transformer";


// @Entity({name: 'tier_withdraws'})
// export class TierWithdraw{
//     @PrimaryGeneratedColumn()
//     @Exclude()
//     id: number;
  
//     @Generated("uuid")
//     @Expose({name: 'id'})
//     @Column()
//     uuid: string

//     @ManyToOne(type => Tier,{onDelete: 'CASCADE'})
//     @JoinColumn({name: 'tier_id'})
//     tier: Tier

//     @ManyToOne(type => WithdrawalMethod,{onDelete: 'CASCADE'})
//     @JoinColumn({name: 'withdraw_id'})
//     withdrawMethod: WithdrawalMethod

//     @Column({default: 0,type:'decimal',precision: 15, scale: 2,transformer: numberTransformer})
//     fee: number
  
// }