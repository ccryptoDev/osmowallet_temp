import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { Currencies } from '../enums';
import { PayoutOptionEnum } from '../enums/payout-options.enum';
import { PayoutOptions } from './payout-options.dto';

class PayoutOption {
    @ApiProperty({
        enum: PayoutOptionEnum,
        description: 'The ID of the payout option',
        example: 'phoneNumber',
    })
    id!: PayoutOptionEnum;

    @ApiProperty({
        description: 'The required fields for the payout option',
        example: { field1: 'value1', field2: 'value2' },
    })
    requiredFields!: PayoutOptions;
}

export class PayoutDTO {
    @ApiProperty({
        description: 'The amount to be paid out',
        example: 100,
    })
    amount!: number;

    @ApiProperty({
        enum: Currencies,
        description: 'The target currency for the payout',
        example: 'BRL',
    })
    targetCurrency!: Currencies;

    @ApiProperty({
        description: 'The selected payout option',
        example: { id: 'clabe', requiredFields: { field1: 'value1', field2: 'value2' } },
    })
    @ValidateNested()
    @Type(() => PayoutOption)
    payoutOption!: PayoutOption;
}
