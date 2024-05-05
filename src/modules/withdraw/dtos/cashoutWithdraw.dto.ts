import { IsNotEmpty, IsNumber } from "class-validator";
import { IsBitcoinAddress } from "src/common/dto_validators/bitcoinAddress.validator";


export class CashoutWithdrawDto{

    @IsBitcoinAddress()
    address: string

    @IsNumber()
    btcPrice: number
}