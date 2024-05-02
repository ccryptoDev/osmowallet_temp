import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBlockChainAddress {
    @ApiProperty({
        description: 'The network ID',
        example: '12345',
    })
    @IsString()
    networkId!: string;

    @ApiProperty({
        description: 'The blockchain address',
        example: '0x123456789',
    })
    @IsString()
    address!: string;
}
