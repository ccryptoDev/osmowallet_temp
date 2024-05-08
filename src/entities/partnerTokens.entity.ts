import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { App } from './app.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'partner_tokens' })
export class PartnerToken {
    @ApiProperty({
        description: 'The unique identifier of the partner token',
        example: 'c7b9a4e1-9e4e-4e8f-9e9d-0a1b2c3d4e5f',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The associated app entity',
        required: true,
    })
    @ManyToOne(() => App, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'app_id' })
    app!: App;

    @ApiProperty({
        description: 'The refresh token',
        example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        required: true,
    })
    @Column({ name: 'refresh_token', type: 'text' })
    refreshToken!: string;
}
