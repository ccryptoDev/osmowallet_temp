import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, Max, Min } from 'class-validator';

export class RecurrentBuyDto {
    @ApiProperty({
        description: 'The amount of the buy',
        example: 100,
    })
    @IsPositive()
    amount!: number;

    @ApiProperty({
        description: 'The ID of the coin',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    coinId!: string;

    @ApiProperty({
        description: 'The number of days between each buy',
        example: 7,
    })
    @IsNumber()
    @Min(1)
    @Max(999)
    days!: number;

    @ApiProperty({
        description: 'The time of the buy',
        example: '12:00 PM',
    })
    @IsString()
    @IsNotEmpty()
    time!: string;
}

export class DeleteRecurrentBuyDTO {
    @ApiProperty({
        description: 'The ID of the recurrent buy to delete',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    @IsString()
    id!: string;
}
