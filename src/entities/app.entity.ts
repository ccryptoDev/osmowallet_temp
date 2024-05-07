import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'apps' })
export class App {
    @ApiProperty({
        description: 'The unique identifier of the app',
        example: 'c7e8a0e1-4e7b-4a3d-9e4d-1e2f5a6b7c8d',
        required: true,
    })
    @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
    id!: string;

    @ApiProperty({
        description: 'The client ID of the app',
        example: 'abc123',
        required: true,
    })
    @Column({ name: 'client_id', unique: true, length: 500 })
    clientId!: string;

    @ApiProperty({
        description: 'The client secret of the app',
        example: 'secret123',
        required: true,
    })
    @Column({ name: 'client_secret', length: 500 })
    clientSecret!: string;

    @ApiProperty({
        description: 'The webhook URL of the app',
        example: 'https://example.com/webhook',
        required: false,
    })
    @Column({ name: 'webhook_url', length: 500, nullable: true })
    webhookURL!: string;

    @ApiProperty({
        description: 'The name of the app',
        example: 'My App',
        required: true,
    })
    @Column()
    name!: string;
}
