import { Transform } from 'class-transformer';
import { IsDate, IsNumber, IsPositive, IsUUID } from 'class-validator';
import { toDate } from 'src/common/transformers/date.transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AutoBuyDto {
    @ApiProperty({
        description: 'The amount of the transaction',
        example: 100,
    })
    @IsPositive()
    @IsNumber()
    amount!: number;

    @ApiProperty({
        description: 'The ID of the coin',
        example: 'abc123',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The expiry date of the transaction',
        example: '2022-01-01',
    })
    @Transform(({ value }) => toDate(value))
    @IsDate()
    expiry!: Date;

    @ApiProperty({
        description: 'The target amount of the transaction',
        example: 200,
    })
    @IsPositive()
    @IsNumber()
    targetAmount!: number;
}
