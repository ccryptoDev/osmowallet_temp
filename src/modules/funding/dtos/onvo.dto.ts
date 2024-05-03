import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OnvoFundingDto {
    @ApiProperty({
        description: 'The ID of the payment method',
        example: '60f6a8e8c9eefb001f9e4a0a',
    })
    @IsMongoId()
    paymentMethodId!: string;
}
