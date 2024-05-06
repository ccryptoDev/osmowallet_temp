
import { CryptoCoinPreference } from 'src/modules/me/enums/cryptoCoinPreference.enum';
import { FiatCoinPreference } from 'src/modules/me/enums/fiatCoinPreference.enum';
import { Entity, Column,OneToOne, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Period } from './period.entity';
import { User } from './user.entity';

@Entity({name: 'preferences'})
export class Preference {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id: string;

  @OneToOne(() => User,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'user_id'})
  user: User

  @ManyToOne(() => Period,{onDelete: 'CASCADE'})
  @JoinColumn({name: 'ask_pin_id'})
  askPin: Period

  @Column({type: 'varchar', enum: FiatCoinPreference, default: FiatCoinPreference.GTQ, name:'fiat_coin'})
  fiatCoin: FiatCoinPreference
  
  @Column({type: 'varchar', enum: CryptoCoinPreference, default: CryptoCoinPreference.SATS, name:'crypto_coin'})
  cryptoCoin: CryptoCoinPreference
  
  @Column({name: 'dynamic_onchain_address', default: false})
  dynamicOnchainAddress: boolean

  @Column({name: 'promotional_notification', default: true})
  promotionalNotification: boolean

  @Column({name: 'security_notification', default: true})
  securityNotification: boolean
}