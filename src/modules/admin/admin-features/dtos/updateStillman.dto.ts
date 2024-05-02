import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpdateStillmanDTO {
    @IsNumber()
    @Min(0)
    buffer?: number;
    @IsNumber()
    @Min(0)
    balancePercentage?: number;
    @IsString()
    @IsNotEmpty()
    stillmanAddress?: string;
}
