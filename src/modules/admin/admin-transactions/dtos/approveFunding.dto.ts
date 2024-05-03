import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsUrl } from 'class-validator';

export class ApproveTransactionDto {
    @ApiProperty({
        description: 'The amount of the transaction',
        example: 100,
    })
    @IsPositive()
    @IsNumber()
    @IsOptional()
    amount!: number;

    @ApiProperty({
        description: 'The link to the transaction explorer',
        example: 'https://example.com/transaction',
    })
    @IsUrl()
    @IsOptional()
    linkExplorer!: string;
}
