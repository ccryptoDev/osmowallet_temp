import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsCreditCard, IsEnum, IsNumber, IsString, Length, Max, Min } from 'class-validator';
import { BrandCard } from '../enums/brand-card.enum';

export class CreateCardDto {
    @ApiProperty({
        description: 'The credit card number',
        example: '4111111111111111',
    })
    @IsCreditCard()
    number!: string;

    @ApiProperty({
        description: 'The expiration month of the card',
        example: 12,
        minimum: 1,
        maximum: 12,
    })
    @IsNumber()
    @Min(1)
    @Max(12)
    expMonth!: number;

    @ApiProperty({
        description: 'The expiration year of the card',
        example: 2024,
        minimum: 2024,
    })
    @IsNumber()
    @Min(2024)
    expYear!: number;

    @ApiProperty({
        description: 'The CVV of the card',
        example: '123',
        minLength: 3,
        maxLength: 4,
    })
    @IsString()
    @Length(3, 4)
    cvv!: string;

    @ApiProperty({
        description: 'The name of the card holder',
        example: 'John Doe',
    })
    @IsString()
    holderName!: string;

    @ApiProperty({
        description: 'The brand of the card',
        example: 'VISA',
        enum: BrandCard,
    })
    @IsEnum(BrandCard)
    brand!: BrandCard;

    @ApiProperty({
        description: 'The alias of the card',
        example: 'My Card',
    })
    @IsString()
    alias!: string;

    @ApiProperty({
        description: 'Indicates if the card is set as default',
        example: true,
    })
    @IsBoolean()
    isDefault!: boolean;
}
