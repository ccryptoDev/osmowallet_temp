import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { RidiviExternalTransferType } from '../enums/transfer-type.enum';

export class CheckRidiviTransferStatusDto {
    @ApiProperty({ description: 'TransactionGroupId from our database' })
    @IsUUID()
    transactionGroupId!: string;

    @ApiProperty({ description: 'Key generated by Ridivi' })
    @IsString()
    loadedKey!: string;

    @ApiProperty({ description: 'Type of transaction', enum: RidiviExternalTransferType })
    @IsEnum(RidiviExternalTransferType)
    type!: RidiviExternalTransferType;
}
