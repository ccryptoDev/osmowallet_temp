import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IbexPayingQueryDto {
    @ApiProperty({
        description: 'The transaction group ID',
        example: '12345',
    })
    @IsOptional()
    transactionGroupId!: string;
}
