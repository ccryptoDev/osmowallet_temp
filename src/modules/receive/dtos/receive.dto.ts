import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ReceiveMethod } from '../enums/receive.enum';

export class ReceiveDto {
    @ApiProperty({
        description: 'The receive method',
        example: 'TRANSFER',
        enum: ReceiveMethod,
    })
    @IsEnum(ReceiveMethod)
    method!: ReceiveMethod;

    @ApiProperty({
        description: 'The amount',
        example: 10,
    })
    @IsNotEmpty()
    amount!: number;

    @ApiProperty({
        description: 'The user ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
    })
    @IsUUID()
    userId!: string;

    @ApiProperty({
        description: 'The coin ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        format: 'uuid',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'Additional data',
        example: { key: 'value' },
        required: false,
    })
    @IsOptional()
    data: any;
}
