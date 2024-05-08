import { IsISO31661Alpha2 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TermsAndConditionsDto {
    @ApiProperty({
        description: 'The country code in ISO 3166-1 alpha-2 format',
        example: 'US',
    })
    @IsISO31661Alpha2()
    country!: string;
}
