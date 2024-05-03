import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { StableCoin } from 'src/common/enums/stableCoin.enum';

export class StableFundingDto {
    @ApiProperty({
        description: 'The network ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    networkId!: string;

    @ApiProperty({
        description: 'The link explorer',
        example: 'https://example.com/explorer',
    })
    @IsString()
    linkExplorer!: string;

    @ApiProperty({
        description: 'The stable coin',
        example: 'USDT',
        enum: StableCoin,
    })
    @IsEnum(StableCoin)
    stableCoin!: StableCoin;
}
