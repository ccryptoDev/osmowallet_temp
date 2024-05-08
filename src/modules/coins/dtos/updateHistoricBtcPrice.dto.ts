import { IsEnum } from 'class-validator';
import { UpdateHistoricBtcPriceType } from '../enums/updateHistoricBtcPrice.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHistoricBtcPriceDto {
    @ApiProperty({
        description: 'The type of update for historic BTC price',
        example: 'HOURLY',
        enum: UpdateHistoricBtcPriceType,
    })
    @IsEnum(UpdateHistoricBtcPriceType)
    type!: UpdateHistoricBtcPriceType;
}
