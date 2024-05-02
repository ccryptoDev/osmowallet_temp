import { CryptoCoinPreference } from 'src/modules/me/enums/cryptoCoinPreference.enum';
import { FiatCoinPreference } from 'src/modules/me/enums/fiatCoinPreference.enum';
import { Entity, Column, OneToOne, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Period } from './period.entity';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'preferences' })
export class Preference {
    @ApiProperty({ example: '1', description: 'The unique identifier of the preference', required: true })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({ example: '1', description: 'The user associated with the preference', required: true })
    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ApiProperty({ example: '1', description: 'The ask pin associated with the preference', required: true })
    @ManyToOne(() => Period, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ask_pin_id' })
    askPin!: Period;

    @ApiProperty({ enum: FiatCoinPreference, example: 'GTQ', description: 'The preferred fiat coin', required: true })
    @Column({ type: 'varchar', enum: FiatCoinPreference, default: FiatCoinPreference.GTQ, name: 'fiat_coin' })
    fiatCoin!: FiatCoinPreference;

    @ApiProperty({ enum: CryptoCoinPreference, example: 'SATS', description: 'The preferred crypto coin', required: true })
    @Column({ type: 'varchar', enum: CryptoCoinPreference, default: CryptoCoinPreference.SATS, name: 'crypto_coin' })
    cryptoCoin!: CryptoCoinPreference;

    @ApiProperty({ example: false, description: 'Whether dynamic on-chain address is enabled', required: true })
    @Column({ name: 'dynamic_onchain_address', default: false })
    dynamicOnchainAddress!: boolean;

    @ApiProperty({ example: true, description: 'Whether promotional notifications are enabled', required: true })
    @Column({ name: 'promotional_notification', default: true })
    promotionalNotification!: boolean;

    @ApiProperty({ example: true, description: 'Whether security notifications are enabled', required: true })
    @Column({ name: 'security_notification', default: true })
    securityNotification!: boolean;
}
