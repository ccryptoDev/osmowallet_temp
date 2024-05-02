import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReceiveQueryDto {
    @ApiProperty({
        description: 'The user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    userId!: string;

    @ApiProperty({
        description: 'The reference ID',
        example: 'abc123',
    })
    @IsString()
    referenceId!: string;
}
