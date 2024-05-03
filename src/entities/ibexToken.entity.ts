import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'ibex_tokens' })
export class IbexToken {
    @ApiProperty({
        description: 'The unique identifier of the token',
        example: 'c7e8e4e4-8e4e-4e4e-8e4e-8e4e8e4e8e4e',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The access token',
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        required: true,
    })
    @Column({ name: 'access_token', type: 'text' })
    accessToken!: string;

    @ApiProperty({
        description: 'The refresh token',
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        required: true,
    })
    @Column({ name: 'refresh_token', type: 'text' })
    refreshToken!: string;
}
