import { IsEnum } from "class-validator";
import { UpdateHistoricBtcPriceType } from "../enums/updateHistoricBtcPrice.enum";


export class UpdateHistoricBtcPriceDto {
    
    @IsEnum(UpdateHistoricBtcPriceType) 
    type: UpdateHistoricBtcPriceType
}