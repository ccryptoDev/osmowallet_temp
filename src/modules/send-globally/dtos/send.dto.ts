import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendGloballyAddressDto {
    @ApiProperty({
        description: 'The address to send globally',
        example: 'example address',
    })
    @IsString()
    address!: string;
}
