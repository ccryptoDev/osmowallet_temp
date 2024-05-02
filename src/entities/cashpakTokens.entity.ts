import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'cashpak_tokens' })
export class CashpakToken {
    @ApiProperty({
        description: 'The unique identifier of the cashpak token',
        example: 'c7e9a2e7-3f0e-4e8d-9a0a-9e3e8c8e7a0b',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The access token of the cashpak token',
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        required: true,
    })
    @Column({ name: 'access_token', type: 'text' })
    accessToken!: string;
}
