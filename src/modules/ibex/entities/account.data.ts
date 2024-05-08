import { ApiProperty } from '@nestjs/swagger';

export class CreateIbexAccountData {
    @ApiProperty({
        description: 'The ID of the account',
        example: '1',
        required: true,
    })
    id!: string;

    @ApiProperty({
        description: 'The ID of the user',
        example: '123',
        required: true,
    })
    userId!: string;

    @ApiProperty({
        description: 'The name of the account',
        example: 'John Doe',
        required: true,
    })
    name!: string;
}
