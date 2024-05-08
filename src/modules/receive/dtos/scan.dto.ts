import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScanDto {
    @ApiProperty({
        description: 'The address',
        example: '0x1234567890abcdef',
    })
    @IsString()
    @IsNotEmpty()
    address!: string;

    @ApiProperty({
        description: 'The rocket',
        example: { name: 'Falcon 9', type: 'Reusable' },
    })
    @IsNotEmpty()
    rocket: any;

    @ApiProperty({
        description: 'The BTC price',
        example: 50000,
        required: false,
    })
    btcPrice?: number;
}
