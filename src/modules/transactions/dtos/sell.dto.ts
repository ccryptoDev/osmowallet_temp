import { IsPositive, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SellDto {
    @ApiProperty({
        description: 'The amount in satoshis',
        example: 100000,
    })
    @IsPositive()
    amountSats!: number;

    @ApiProperty({
        description: 'The ID of the coin',
        example: 'c7a2b3e4-5d6f-7g8h-9i0j-1k2l3m4n5o6p',
    })
    @IsUUID()
    coinId!: string;
}
