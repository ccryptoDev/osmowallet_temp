import { IsEnum } from "class-validator";
import { AmassedAmount } from "../enums/resetAmassedAmount.enum";



export class ResetAmassedAmountDto {

    @IsEnum(AmassedAmount)
    type: AmassedAmount
}