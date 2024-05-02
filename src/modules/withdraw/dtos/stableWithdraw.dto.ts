import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { StableCoin } from 'src/common/enums/stableCoin.enum';

export class StableWithdrawDto {
    @ApiProperty({
        description: 'The network address ID',
        example: '1234567890',
    })
    @IsString()
    networkAddressId!: string;

    @ApiProperty({
        description: 'The stable coin',
        example: StableCoin.USDT,
        enum: StableCoin,
    })
    @IsEnum(StableCoin)
    stableCoin!: StableCoin;
}
