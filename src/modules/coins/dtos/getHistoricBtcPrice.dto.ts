import { IsEnum } from "class-validator";
import { GetHistoricBtcPriceType } from "../enums/getHistoricBtcPrice.enum";


export class GetHistoricBtcPriceDto {

    @IsEnum(GetHistoricBtcPriceType)
    period: GetHistoricBtcPriceType
}