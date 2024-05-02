import { Transform, Type } from 'class-transformer';
import { IsArray, IsDate, IsEmail, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Status } from 'src/common/enums/status.enum';
import { toDate } from 'src/common/transformers/date.transformer';
import { ApiProperty } from '@nestjs/swagger';

class Transaction {
    @ApiProperty({
        description: 'The ID of the transaction',
        example: '12345678-1234-1234-1234-123456789abc',
    })
    @IsUUID()
    id!: string;

    @ApiProperty({
        description: 'The status of the transaction',
        example: 'PENDING',
        enum: Status,
    })
    @IsEnum(Status)
    status!: string;

    @ApiProperty({
        description: 'The reason associated with the status transaction',
        example: 'The reason it was pending is that no matching transaction was found in the CSV data.',
    })
    @IsString()
    reason!: string;

    @ApiProperty({
        description: 'The email associated with the transaction',
        example: 'example@example.com',
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        description: 'The username associated with the transaction',
        example: 'john_doe',
    })
    @IsString()
    username!: string;

    @ApiProperty({
        description: 'The first name of the user associated with the transaction',
        example: 'John',
        required: false,
    })
    @IsString()
    @IsOptional()
    firstName!: string;

    @ApiProperty({
        description: 'The last name of the user associated with the transaction',
        example: 'Doe',
        required: false,
    })
    @IsString()
    @IsOptional()
    lastName!: string;

    @ApiProperty({
        description: 'The amount of the transaction',
        example: 100.5,
    })
    @IsNumber()
    amount!: number;

    @ApiProperty({
        description: 'The creation date of the transaction',
        example: '2022-01-01T00:00:00Z',
    })
    @Transform(({ value }) => toDate(value))
    @IsDate()
    createdAt!: Date;
}

export class TransactionsValidatedDto {
    @ApiProperty({
        description: 'An array of validated transactions',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Transaction)
    transactions!: Transaction[];
}
