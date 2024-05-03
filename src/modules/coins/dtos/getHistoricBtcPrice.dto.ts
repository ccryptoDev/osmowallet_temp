import { IsEnum } from 'class-validator';
import { GetHistoricBtcPriceType } from '../enums/getHistoricBtcPrice.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GetHistoricBtcPriceDto {
    @ApiProperty({
        description: 'The period for getting historic BTC price',
        example: 'DAILY',
        enum: GetHistoricBtcPriceType,
    })
    @IsEnum(GetHistoricBtcPriceType)
    period!: GetHistoricBtcPriceType;
}
