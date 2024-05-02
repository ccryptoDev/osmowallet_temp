import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class GetFundingByTierDto {
    @ApiProperty({
        description: 'The ID of the tier',
        example: 'e7c2a8e4-3e7b-4a4f-9e0e-9c3e7b4a4f9e',
    })
    @IsUUID()
    @IsOptional()
    tierId!: string;
}
