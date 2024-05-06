import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { toNumber } from 'src/common/transformers/number.transformer';

export class EstimateBtcSendDto {
  @Transform(({ value }) => toNumber(value, { default: 0 }))
  @IsInt()
  @IsOptional()
  amountSats: number = 0;

  @IsString()
  @IsNotEmpty()
  address: string;
}
