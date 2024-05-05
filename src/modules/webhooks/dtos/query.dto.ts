import { IsOptional } from 'class-validator';


export class IbexPayingQueryDto {
  @IsOptional()
  transactionGroupId: string;
}
