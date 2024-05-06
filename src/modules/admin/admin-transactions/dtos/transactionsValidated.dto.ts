import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsEmail,
    IsEnum,
    IsNumber, IsOptional, IsString,
    IsUUID,
    ValidateNested
} from 'class-validator';
import { Status } from 'src/common/enums/status.enum';
import { toDate } from 'src/common/transformers/date.transformer';

class Transaction {
  @IsUUID()
  id: string;

  @IsEnum(Status)
  status: string;

  @IsEmail()
  email: string;

  @IsString()
  username: string;
  
  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsNumber()
  amount: number;

  @Transform(({ value }) => toDate(value))
  @IsDate()
  createdAt: Date;
}

export class TransactionsValidatedDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Transaction)
  transactions: Transaction[];
}