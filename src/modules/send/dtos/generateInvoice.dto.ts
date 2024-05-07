import { IsEmail, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateInvoiceFromEmail {
    @ApiProperty({
        description: 'The email address of the recipient',
        example: 'example@example.com',
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        description: 'The amount of the invoice',
        example: 100,
    })
    @IsInt()
    amount!: number;
}
