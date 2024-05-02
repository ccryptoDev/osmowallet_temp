import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsUUID, MaxLength } from 'class-validator';
import { IsMobileValid } from 'src/common/dto_validators/mobile.validator';

export class SendFiatDto {
    @ApiProperty({ example: 'uuid', description: 'The ID of the receiver' })
    @IsUUID()
    @IsOptional()
    receiverId!: string;

    @ApiProperty({ example: 100, description: 'The amount of fiat to send' })
    @IsPositive()
    @IsNumber()
    amount!: number;

    @ApiProperty({ example: 'uuid', description: 'The ID of the coin' })
    @IsUUID()
    coinId!: string;

    @ApiProperty({ example: '+1234567890', description: 'The mobile number' })
    @IsMobileValid({ message: 'Este no es un número de teléfono válido' })
    @IsOptional()
    mobile!: string;

    @ApiProperty({ example: 'This is a note', description: 'The note' })
    @MaxLength(50, {
        message: 'La nota es muy larga!',
    })
    @IsOptional()
    note?: string;
}
