import { ApiProperty } from '@nestjs/swagger';

export class IbexDto {
    @ApiProperty({
        description: 'The user ID',
        example: '12345',
    })
    userId!: string;

    @ApiProperty({
        description: 'The account ID',
        example: '67890',
    })
    accountId!: string;

    @ApiProperty({
        description: 'The Ibex account ID',
        example: '54321',
    })
    ibexAccountId!: string;
}
