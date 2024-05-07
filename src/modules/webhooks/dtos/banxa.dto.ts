import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BanxaUpdateTransactioDto {
    @ApiProperty({
        description: 'The order ID',
        example: '123456789',
    })
    @IsNotEmpty()
    order_id!: string;
}
