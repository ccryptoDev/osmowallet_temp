import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { toNumber } from 'src/common/transformers/number.transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EstimateBtcSendDto {
    @ApiProperty({
        description: 'The amount in satoshis to send',
        example: 100000,
    })
    @Transform(({ value }) => toNumber(value, { default: 0, min: 0, max: 100 }))
    @IsInt()
    @IsOptional()
    amountSats?: number = 0;

    @ApiProperty({
        description: 'The recipient address',
        example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    })
    @IsString()
    @IsNotEmpty()
    address!: string;
}
