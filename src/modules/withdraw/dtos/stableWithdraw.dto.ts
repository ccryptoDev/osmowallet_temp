import { IsEnum, IsString } from "class-validator";
import { StableCoin } from "src/common/enums/stableCoin.enum";



export class StableWithdrawDto {

    @IsString()
    networkAddressId: string

    @IsEnum(StableCoin)
    stableCoin: StableCoin
    
}