import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

  @IsNumber()
  btcPrice?: number

  @IsEnum(Partner)
  @IsOptional()
  partner?: Partner

  @IsUUID()
  @IsOptional()
  categoryId?: string

  @IsOptional()
  note?: string
}

export class SendDtoV3{
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

  @IsNotEmpty()
  rocket: any;

  btcPrice?: number

  @IsEnum(Partner)
  @IsOptional()
  partner?: Partner

  @IsUUID()
  @IsOptional()
  categoryId?: string

  @IsOptional()
  note?: string
}