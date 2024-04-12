import { IsBoolean, IsEnum, IsUUID } from "class-validator";
import { CryptoCoinPreference } from "../enums/cryptoCoinPreference.enum";
import { FiatCoinPreference } from "../enums/fiatCoinPreference.enum";


export class PreferenceDto{

    @IsBoolean()
    promotionalNotification: boolean

    @IsBoolean()
    dynamicOnchainAddress: boolean

    @IsBoolean()
    securityNotification: boolean

    @IsEnum(CryptoCoinPreference)
    cryptoCoin: CryptoCoinPreference

    @IsEnum(FiatCoinPreference)
    fiatCoin: FiatCoinPreference

    @IsUUID()
    askPin: string
    
}
