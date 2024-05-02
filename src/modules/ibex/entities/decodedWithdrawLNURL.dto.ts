import { ApiProperty } from '@nestjs/swagger';

export class DecodedWithdrawLNURL {
    @ApiProperty({
        description: 'The callback URL',
        example: 'https://example.com/callback',
        required: true,
    })
    callback!: string;

    @ApiProperty({
        description: 'The minimum amount that can be withdrawn',
        example: 10,
        required: true,
    })
    minWithdrawable!: number;

    @ApiProperty({
        description: 'The maximum amount that can be withdrawn',
        example: 100,
        required: true,
    })
    maxWithdrawable!: number;

    @ApiProperty({
        description: 'The default description for the withdrawal',
        example: 'Withdrawal from Osmo Wallet',
        required: true,
    })
    defaultDescription!: string;

    @ApiProperty({
        description: 'The k1 parameter',
        example: 'abcdef123456',
        required: true,
    })
    k1!: string;

    @ApiProperty({
        description: 'The tag',
        example: 'withdraw',
        required: true,
    })
    tag!: string;
}
