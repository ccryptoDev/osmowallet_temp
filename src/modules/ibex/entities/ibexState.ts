import { ApiProperty } from '@nestjs/swagger';

export class IbexState {
    @ApiProperty({
        description: 'The unique identifier of the IbexState',
        example: 1,
        required: true,
    })
    id!: number;

    @ApiProperty({
        description: 'The name of the IbexState',
        example: 'IbexState 1',
        required: true,
    })
    name!: string;

    @ApiProperty({
        description: 'The description of the IbexState',
        example: 'This is the first IbexState',
        required: true,
    })
    description!: string;
}
