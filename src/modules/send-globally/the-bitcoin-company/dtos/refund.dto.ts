import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefundDTO {
    @ApiProperty({
        description: 'The ID of the refund',
        example: '12345',
    })
    @IsString()
    id!: string;

    @ApiProperty({
        description: 'The PR of the refund',
        example: 'PR123',
    })
    @IsString()
    pr!: string;
}
