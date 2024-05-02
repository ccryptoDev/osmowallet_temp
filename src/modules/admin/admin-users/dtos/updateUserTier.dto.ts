import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserTier {
    @ApiProperty({
        description: 'The ID of the tier',
        example: 'c7a3e9f0-4b7e-4e8d-9a3f-2e7b6e0d8a1b',
    })
    @IsUUID()
    tierId!: string;
}
