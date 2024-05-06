import Decimal from "decimal.js";
import { Setting } from "src/entities/setting.entity";

export enum RateType {
    LOWER = 'LOWER',
    UPPER = 'UPPER'
}

export function getStableRate(settings: Setting[], type: RateType, acronym: string) {
    let value: Decimal
    switch(type){
        case(RateType.UPPER):
        value = new Decimal(settings.find(setting => setting.name == `UPPER_RATE_STABLE_${acronym}`).value)
        break;
        default:
        value = new Decimal(settings.find(setting => setting.name == `LOWER_RATE_STABLE_${acronym}`).value)
    }
    return value
}