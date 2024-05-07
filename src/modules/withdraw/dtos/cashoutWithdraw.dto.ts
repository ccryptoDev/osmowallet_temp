import { IsNumber } from 'class-validator';
import { IsBitcoinAddress } from 'src/common/dto_validators/bitcoinAddress.validator';
import { ApiProperty } from '@nestjs/swagger';

export class CashoutWithdrawDto {
    @ApiProperty({
        description: 'The Bitcoin address for the withdrawal',
        example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    })
    @IsBitcoinAddress()
    address!: string;

    @ApiProperty({
        description: 'The price of Bitcoin in BTC',
        example: 50000,
    })
    @IsNumber()
    btcPrice!: number;
}
