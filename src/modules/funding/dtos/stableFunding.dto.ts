import { IsEnum, IsString, IsUUID } from "class-validator"
import { StableCoin } from "src/common/enums/stableCoin.enum"


export class StableFundingDto {

    @IsUUID()
    networkId: string

    @IsString()
    linkExplorer: string

    @IsEnum(StableCoin)
    stableCoin: StableCoin
}