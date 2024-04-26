import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { Partner } from 'src/common/enums/partner.enum';

export class SendDto {
  @IsNumber()
  @IsOptional()
  amount: number = 0;

  @IsString()
  address: string;

  @IsUUID()
  coinId: string;

  @IsNumber()
  @IsOptional()
  feeSat: number = 0;

  @IsPositive()
  @IsNumber()
  btcPrice: number;

  @IsEnum(Partner)
  @IsOptional()
  partner?: Partner

  @IsUUID()
  @IsOptional()
  categoryId?: string

  @IsOptional()
  note?: string
}
