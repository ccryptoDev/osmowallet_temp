import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { toDate } from 'src/common/transformers/date.transformer';
import { TransactionMetricPeriod } from '../../admin-users/enums/period.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GetTransactionsMetricsDto {
    @ApiProperty({
        description: 'The ID of the coin',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The period of the transaction metrics',
        example: 'DAILY',
        enum: TransactionMetricPeriod,
        enumName: 'TransactionMetricPeriod',
        required: false,
    })
    @IsEnum(TransactionMetricPeriod)
    @IsOptional()
    period!: TransactionMetricPeriod;

    @ApiProperty({
        description: 'The start date of the custom period',
        example: '2022-01-01',
        required: false,
    })
    @IsOptional()
    @IsDate()
    @Transform(({ value }) => toDate(value))
    @ValidateIf((o) => o.period === TransactionMetricPeriod.CUSTOM)
    fromDate!: Date;

    @ApiProperty({
        description: 'The end date of the custom period',
        example: '2022-01-31',
        required: false,
    })
    @IsOptional()
    @IsDate()
    @Transform(({ value }) => toDate(value))
    @ValidateIf((o) => o.period === TransactionMetricPeriod.CUSTOM)
    toDate!: Date;
}
