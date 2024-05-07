import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClabePayoutDTO {
    @ApiProperty({
        description: 'The CLABE number',
        example: '012345678901234567',
    })
    @IsString()
    clabe!: string;

    @ApiProperty({
        description: 'The name of the recipient',
        example: 'John Doe',
    })
    @IsString()
    recipientName!: string;
}

export class PhoneNumberPayoutDTO {
    @ApiProperty({
        description: 'The phone number',
        example: '1234567890',
    })
    @IsString()
    phoneNumber!: string;

    @ApiProperty({
        description: 'The name of the recipient',
        example: 'John Doe',
    })
    @IsString()
    recipientName!: string;

    @ApiProperty({
        description: 'The institution number',
        example: '1234',
    })
    @IsString()
    institutionNumber!: string;
}

export class DebitCardPayoutDTO {
    @ApiProperty({
        description: 'The card number',
        example: '1234567890123456',
    })
    @IsString()
    cardNumber!: string;

    @ApiProperty({
        description: 'The name of the recipient',
        example: 'John Doe',
    })
    @IsString()
    recipientName!: string;

    @ApiProperty({
        description: 'The institution number',
        example: '1234',
    })
    @IsString()
    institutionNumber!: string;
}

export class PixPayoutDTO {
    @ApiProperty({
        description: 'The PIX key',
        example: 'abc123',
    })
    @IsString()
    pixKey!: string;

    @ApiProperty({
        description: 'The name of the recipient',
        example: 'John Doe',
    })
    @IsString()
    recipientName!: string;
}

export type PayoutOptions = ClabePayoutDTO | PhoneNumberPayoutDTO | DebitCardPayoutDTO | PixPayoutDTO;
