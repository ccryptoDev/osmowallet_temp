import Decimal from 'decimal.js';
import { Setting } from 'src/entities/setting.entity';

export enum RateType {
    LOWER = 'LOWER',
    UPPER = 'UPPER',
}

export function getStableRate(settings: Setting[], type: RateType, acronym: string) {
    let value: Decimal;
    switch (type) {
        case RateType.UPPER:
            const upperSetting = settings.find((setting) => setting.name == `UPPER_RATE_STABLE_${acronym}`);
            value = upperSetting ? new Decimal(upperSetting.value) : new Decimal(0);
            break;
        default:
            const lowerSetting = settings.find((setting) => setting.name == `LOWER_RATE_STABLE_${acronym}`);
            value = lowerSetting ? new Decimal(lowerSetting.value) : new Decimal(0);
    }
    return value;
}
