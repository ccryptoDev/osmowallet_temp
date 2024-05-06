import { IsEnum, IsNotEmpty, IsNumber, IsObject, ValidateNested } from "class-validator";
import { Currencies } from "../enums";
import { PayoutOptionEnum } from "../enums/payout-options.enum";
import { PayoutOptions } from "./payout-options.dto";
import { Type } from "class-transformer";


class PayoutOption {
  @IsEnum(PayoutOptionEnum)
  id: PayoutOptionEnum;

  @IsObject()
  requiredFields: PayoutOptions
}

export class PayoutDTO {
  @IsNumber()
  amount: number;
  @IsNotEmpty()

  @IsEnum(Currencies)
  targetCurrency: Currencies

  @ValidateNested()
  @Type(() => PayoutOption)
  payoutOption: PayoutOption
}
