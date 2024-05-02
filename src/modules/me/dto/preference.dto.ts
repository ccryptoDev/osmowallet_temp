import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsUUID } from 'class-validator';
import { CryptoCoinPreference } from '../enums/cryptoCoinPreference.enum';
import { FiatCoinPreference } from '../enums/fiatCoinPreference.enum';

export class PreferenceDto {
    @ApiProperty({
        description: 'Flag indicating whether promotional notifications are enabled',
        example: true,
    })
    @IsBoolean()
    promotionalNotification!: boolean;

    @ApiProperty({
        description: 'Flag indicating whether dynamic on-chain addresses are enabled',
        example: false,
    })
    @IsBoolean()
    dynamicOnchainAddress!: boolean;

    @ApiProperty({
        description: 'Flag indicating whether security notifications are enabled',
        example: true,
    })
    @IsBoolean()
    securityNotification!: boolean;

    @ApiProperty({
        description: 'The preferred cryptocurrency coin',
        example: 'SATS',
        enum: CryptoCoinPreference,
    })
    @IsEnum(CryptoCoinPreference)
    cryptoCoin!: CryptoCoinPreference;

    @ApiProperty({
        description: 'The preferred fiat currency coin',
        example: FiatCoinPreference.USD,
        enum: FiatCoinPreference,
    })
    @IsEnum(FiatCoinPreference)
    fiatCoin!: FiatCoinPreference;

    @ApiProperty({
        description: 'The PIN used for authentication',
        example: '1234-5678-9012',
    })
    @IsUUID()
    askPin!: string;
}
