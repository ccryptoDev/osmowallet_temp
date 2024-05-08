import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EstimateScanToReceiveDto {
    @ApiProperty({
        description: 'The address to receive the scan',
        example: '0x1234567890abcdef',
    })
    @IsString()
    @IsNotEmpty()
    address!: string;
}
