import { ApiProperty } from '@nestjs/swagger';

export class IbexRate {
    @ApiProperty({
        description: 'The update timestamp in Unix format',
        example: 1629876543,
        required: true,
    })
    updateAtUnix!: number;

    @ApiProperty({
        description: 'The rate value',
        example: 1.2345,
        required: true,
    })
    rate!: number;

    @ApiProperty({
        description: 'The ID of the primary currency',
        example: 1,
        required: true,
    })
    primaryCurrencyID!: number;

    @ApiProperty({
        description: 'The ID of the secondary currency',
        example: 2,
        required: true,
    })
    secondaryCurrencyID!: number;
}
