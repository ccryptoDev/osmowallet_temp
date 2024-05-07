import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SinpeFundingDto {
    @ApiProperty({
        description: 'The IBAN from which the funding is made',
        example: 'NL91ABNA0417164300',
    })
    @IsString()
    iban!: string;
}
