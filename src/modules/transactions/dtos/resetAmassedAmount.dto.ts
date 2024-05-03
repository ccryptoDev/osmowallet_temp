import { IsEnum } from 'class-validator';
import { AmassedAmount } from '../enums/resetAmassedAmount.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ResetAmassedAmountDto {
    @ApiProperty({
        description: 'The type of amassed amount',
        example: 'DAILY',
        enum: AmassedAmount,
    })
    @IsEnum(AmassedAmount)
    type!: AmassedAmount;
}
