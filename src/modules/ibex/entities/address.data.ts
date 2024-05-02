import { ApiProperty } from '@nestjs/swagger';

export class CreateIbexAddressData {
    @ApiProperty({
        description: 'The LN address',
        example: 'lnAddressExample',
        required: true,
    })
    lnAddress!: string;

    @ApiProperty({
        description: 'The on-chain address',
        example: 'onChainAddressExample',
        required: true,
    })
    onChainAddress!: string;

    @ApiProperty({
        description: 'The LN URL payer address',
        example: 'lnUrlPayerAddressExample',
        required: true,
    })
    lnUrlPayerAddress!: string;
}
