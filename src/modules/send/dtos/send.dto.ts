import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Partner } from 'src/common/enums/partner.enum';
import { ApiProperty } from '@nestjs/swagger';

export class SendDto {
    @ApiProperty({ example: 100, description: 'The amount to send' })
    @IsNumber()
    @IsOptional()
    amount: number = 0;

    @ApiProperty({ example: 'example_address', description: 'The recipient address' })
    @IsString()
    address!: string;

    @ApiProperty({ example: 'example_coin_id', description: 'The coin ID' })
    @IsUUID()
    coinId!: string;

    @ApiProperty({ example: 10, description: 'The fee in satoshis' })
    @IsNumber()
    @IsOptional()
    feeSat: number = 0;

    @ApiProperty({ example: 5000, description: 'The BTC price' })
    btcPrice?: number;

    @ApiProperty({ example: 'example_partner', description: 'The partner', enum: Partner })
    @IsEnum(Partner)
    @IsOptional()
    partner?: Partner;

    @ApiProperty({ example: 'example_category_id', description: 'The category ID' })
    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @ApiProperty({ example: 'example_note', description: 'The note' })
    @IsOptional()
    note?: string;
}

export class SendDtoV3 {
    @ApiProperty({ example: 100, description: 'The amount to send' })
    @IsNumber()
    @IsOptional()
    amount: number = 0;

    @ApiProperty({ example: 'example_address', description: 'The recipient address' })
    @IsString()
    address!: string;

    @ApiProperty({ example: 'example_coin_id', description: 'The coin ID' })
    @IsUUID()
    coinId!: string;

    @ApiProperty({ example: 10, description: 'The fee in satoshis' })
    @IsNumber()
    @IsOptional()
    feeSat: number = 0;

    @ApiProperty({ example: { rocket: 'example_rocket' }, description: 'The rocket object' })
    @IsNotEmpty()
    rocket: any;

    @ApiProperty({ example: 5000, description: 'The BTC price' })
    btcPrice?: number;

    @ApiProperty({ example: 'example_partner', description: 'The partner', enum: Partner })
    @IsEnum(Partner)
    @IsOptional()
    partner?: Partner;

    @ApiProperty({ example: 'example_category_id', description: 'The category ID' })
    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @ApiProperty({ example: 'example_note', description: 'The note' })
    @IsOptional()
    note?: string;
}
