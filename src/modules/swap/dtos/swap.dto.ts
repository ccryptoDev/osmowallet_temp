import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsUUID } from "class-validator";
import { WalletSwap } from "../enums/swapWallet.enum";


export class SwapDto{

    @IsUUID()
    fromCoinId: string

    @IsUUID()
    toCoinId: string

    @IsPositive()
    @IsNumber()
    @IsNotEmpty()
    amount: number

    @IsNumber()
    btcPrice?: number

    @IsEnum(WalletSwap)
    @IsOptional()
    wallet: WalletSwap = WalletSwap.OSMO
}

export class SwapDtoTwo {
    @IsUUID()
    fromCoinId: string

    @IsUUID()
    toCoinId: string

    @IsPositive()
    @IsNumber()
    @IsNotEmpty()
    amount: number

    @IsNotEmpty()
    rocket: any

    btcPrice?: number

    @IsEnum(WalletSwap)
    @IsOptional()
    wallet: WalletSwap = WalletSwap.OSMO
}