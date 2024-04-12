import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, Max, Min } from 'class-validator';

export class RecurrentBuyDto {
    @IsPositive()
    amount: number;

    @IsUUID()
    coinId: string;

    @IsNumber()
    @Min(1)
    @Max(999)
    days: number;

    @IsString()
    @IsNotEmpty()
    time: string;
}

export class ProcessRecurrentBuyDtoTest {
    @IsNotEmpty()
    @IsString()
    time: string
}