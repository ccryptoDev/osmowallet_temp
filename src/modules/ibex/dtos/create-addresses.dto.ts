import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIbexAddressesDto {
    @ApiProperty({
        description: 'The ID of the Ibex account',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    ibexAccountId!: string;
}
