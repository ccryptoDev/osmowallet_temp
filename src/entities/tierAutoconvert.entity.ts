// import { Exclude, Expose } from "class-transformer";
// import { Column, Entity, Generated, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
// import { AutoconvertType } from "./autoconvertTypes";
// import { Tier } from "./tier.entity";
// import { numberTransformer } from "src/common/transformers/decimal.transformer";


// @Entity({name: 'tier_autoconverts'})
// export class TierAutoconvert{
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

//     @ManyToOne(type => AutoconvertType,{onDelete: 'CASCADE'})
//     @JoinColumn({name: 'autoconvert_type_id'})
//     autoconvertType: AutoconvertType

//     @Column({default: 0.0, type: 'decimal', precision: 15, scale:2,transformer: numberTransformer})
//     fee: number



// }