import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsInt, IsString } from 'class-validator';

export class CreateTransactionCategoryDto {
    @ApiProperty({
        description: 'The name of the transaction category',
        example: 'Food',
    })
    @IsString()
    name!: string;

    @ApiProperty({
        description: 'The icon ID of the transaction category',
        example: 1,
    })
    @IsInt()
    icon!: number;

    @ApiProperty({
        description: 'The color of the transaction category in hexadecimal format',
        example: '#FF0000',
    })
    @IsHexColor()
    color!: string;
}
