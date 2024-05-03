import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { WalletSwap } from '../enums/swapWallet.enum';

export class SwapDto {
    @ApiProperty({ description: 'The ID of the from coin', example: '12345678-1234-1234-1234-123456789abc' })
    @IsUUID()
    fromCoinId!: string;

    @ApiProperty({ description: 'The ID of the to coin', example: '87654321-4321-4321-4321-987654321cba' })
    @IsUUID()
    toCoinId!: string;

    @ApiProperty({ description: 'The amount to swap', example: 10 })
    @IsPositive()
    @IsNumber()
    @IsNotEmpty()
    amount!: number;

    @ApiProperty({ description: 'The BTC price', example: 50000 })
    @IsNumber()
    btcPrice!: number;

    @ApiProperty({ description: 'The wallet type', example: 'OSMO', enum: WalletSwap })
    @IsEnum(WalletSwap)
    @IsOptional()
    wallet: WalletSwap = WalletSwap.OSMO;
}

export class SwapDtoTwo {
    @ApiProperty({ description: 'The ID of the from coin', example: '12345678-1234-1234-1234-123456789abc' })
    @IsUUID()
    fromCoinId!: string;

    @ApiProperty({ description: 'The ID of the to coin', example: '87654321-4321-4321-4321-987654321cba' })
    @IsUUID()
    toCoinId!: string;

    @ApiProperty({ description: 'The amount to swap', example: 10 })
    @IsPositive()
    @IsNumber()
    @IsNotEmpty()
    amount!: number;

    @ApiProperty({ description: 'The rocket property', example: {} })
    @IsNotEmpty()
    rocket!: any;

    @ApiProperty({ description: 'The BTC price', example: 50000 })
    @IsNumber()
    @IsOptional()
    btcPrice?: number;

    @ApiProperty({ description: 'The wallet type', example: 'OSMO', enum: WalletSwap })
    @IsEnum(WalletSwap)
    @IsOptional()
    wallet: WalletSwap = WalletSwap.OSMO;
}
