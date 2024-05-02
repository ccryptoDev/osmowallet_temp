import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUrl } from 'class-validator';

export class CreateOsmoBusinessDto {
    @ApiProperty({
        description: 'The name of the Osmo business',
        example: 'Osmo Business',
    })
    @IsString()
    name!: string;

    @ApiProperty({
        description: 'The BPT name of the Osmo business',
        example: 'BPT Business',
    })
    @IsString()
    bptName!: string;

    @ApiProperty({
        description: 'The URL of the Osmo business',
        example: 'https://example.com',
    })
    @IsUrl()
    url!: string;

    @ApiProperty({
        description: 'The image of the Osmo business',
        example: [1, 2, 3],
    })
    @IsInt({ each: true })
    image!: Array<number>;
}
