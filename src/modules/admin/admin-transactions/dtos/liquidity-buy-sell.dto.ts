import { Type } from 'class-transformer';
import { IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LiquidityFiat {
    @ApiProperty({
        description: 'The ID of the coin',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The amount of fiat currency',
        example: 1000,
    })
    @IsNumber()
    amount!: number;
}

export class LiquidityCrypto {
    @ApiProperty({
        description: 'The ID of the coin',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The amount of crypto currency',
        example: 0.5,
    })
    @IsNumber()
    amount!: number;

    @ApiProperty({
        description: 'The fee for the transaction',
        example: 0.01,
    })
    @IsNumber()
    fee!: number;
}

export class LiquidityTransactionDto {
    @ApiProperty({
        description: 'The fiat liquidity details',
    })
    @Type(() => LiquidityFiat)
    fiat!: LiquidityFiat;

    @ApiProperty({
        description: 'The crypto liquidity details',
    })
    @ValidateNested()
    @Type(() => LiquidityCrypto)
    crypto!: LiquidityCrypto;
}
