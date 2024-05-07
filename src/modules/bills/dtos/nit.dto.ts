import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NitDto {
    @ApiProperty({
        description: 'The NIT (Número de Identificación Tributaria)',
        example: '123456789',
    })
    @IsNotEmpty()
    nit!: string;
}
