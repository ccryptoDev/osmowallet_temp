import { IsEnum, IsUUID } from "class-validator";
import { Month } from "../enums/months.enum";


export class NetFlowMetricDto {

    @IsUUID()
    coinId: string

    @IsEnum(Month)
    fromMonth: Month
    
    @IsEnum(Month)
    toMonth: Month
}