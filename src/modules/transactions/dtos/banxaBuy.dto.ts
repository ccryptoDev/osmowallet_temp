import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BanxaBuyDto {
    @ApiProperty({
        description: 'The amount of the purchase',
        example: 100,
    })
    @IsPositive()
    @IsNumber()
    amount!: number;
}
