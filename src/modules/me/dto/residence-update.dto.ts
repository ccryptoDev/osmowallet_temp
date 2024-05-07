import { ApiProperty } from '@nestjs/swagger';
import { IsISO31661Alpha2 } from 'class-validator';

export class UpdateResidenceDto {
    @ApiProperty({
        description: 'The residence',
        example: 'US',
    })
    @IsISO31661Alpha2()
    residence!: string;
}
