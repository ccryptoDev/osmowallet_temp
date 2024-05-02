import { Transform } from 'class-transformer';
import { IsDate, IsInt } from 'class-validator';
import { toDate } from 'src/common/transformers/date.transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTransactionsBodyDto {
    @ApiProperty({ description: 'Array of file numbers', example: [1, 2, 3] })
    @IsInt({ each: true })
    file!: number[];
}

export class ValidateTransactionsQueryDto {
    @ApiProperty({ description: 'From date', example: '2022-01-01' })
    @IsDate()
    @Transform(({ value }) => toDate(value))
    fromDate!: Date;

    @ApiProperty({ description: 'To date', example: '2022-01-31' })
    @IsDate()
    @Transform(({ value }) => toDate(value))
    toDate!: Date;
}
