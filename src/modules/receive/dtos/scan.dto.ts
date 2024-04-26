import { IsNotEmpty, IsNumber, IsString } from "class-validator";


export class ScanDto{
    
    @IsString()
    @IsNotEmpty()
    address: string

    @IsNumber()
    btcPrice: number
}