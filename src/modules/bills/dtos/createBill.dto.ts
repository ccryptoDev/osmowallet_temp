import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBillDto {
    @ApiProperty({
        description: 'The ID of the user',
        example: '123456789',
    })
    @IsNotEmpty()
    userId!: string;
}
