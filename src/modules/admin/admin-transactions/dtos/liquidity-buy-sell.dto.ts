import { Type } from "class-transformer";
import { IsNumber, IsUUID, ValidateNested } from "class-validator";

export class LiquidityFiat {
    @IsUUID()
    coinId: string

    @IsNumber()
    amount: number
}

export class LiquidityCrypto {
    @IsUUID()
    coinId: string

    @IsNumber()
    amount: number

    @IsNumber()
    fee: number
}

export class LiquidityTransactionDto {
    @Type(() => LiquidityFiat)
    fiat: LiquidityFiat

    @ValidateNested()
    @Type(() => LiquidityCrypto)
    crypto: LiquidityCrypto

}
