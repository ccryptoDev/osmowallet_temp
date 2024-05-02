import { IsDate, IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { TransactionMetricPeriod } from '../enums/period.enum';
import { Transform } from 'class-transformer';
import { toDate } from 'src/common/transformers/date.transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionMetricDto {
    @ApiProperty({ example: 'e7e9d6c2-4e8f-4e1b-9f8a-8e9e0e4e3d2c', description: 'The ID of the user' })
    @IsUUID()
    @IsOptional()
    userId!: string;

    @ApiProperty({ example: 'e7e9d6c2-4e8f-4e1b-9f8a-8e9e0e4e3d2c', description: 'The ID of the coin' })
    @IsUUID()
    coinId!: string;

    @ApiProperty({ enum: TransactionMetricPeriod, description: 'The period of the transaction metric' })
    @IsEnum(TransactionMetricPeriod)
    period!: TransactionMetricPeriod;

    @ApiProperty({ example: '2022-01-01', description: 'The start date of the custom period' })
    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    @ValidateIf((o) => o.period === TransactionMetricPeriod.CUSTOM)
    fromDate!: Date;

    @ApiProperty({ example: '2022-01-31', description: 'The end date of the custom period' })
    @Transform(({ value }) => toDate(value))
    @IsDate()
    @IsOptional()
    @ValidateIf((o) => o.period === TransactionMetricPeriod.CUSTOM)
    toDate!: Date;
}
