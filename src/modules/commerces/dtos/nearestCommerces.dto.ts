import { Transform } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NearestCommerceDto {
    @ApiProperty({
        description: 'The radius in kilometers',
        example: 10,
    })
    @Min(10)
    @IsNumber()
    @Transform(({ value }) => Number.parseFloat(value))
    radius!: number;

    @ApiProperty({
        description: 'The latitude coordinate',
        example: 37.7749,
    })
    @IsLatitude()
    @Transform(({ value }) => Number.parseFloat(value))
    lat!: number;

    @ApiProperty({
        description: 'The longitude coordinate',
        example: -122.4194,
    })
    @IsLongitude()
    @Transform(({ value }) => Number.parseFloat(value))
    lon!: number;
}
