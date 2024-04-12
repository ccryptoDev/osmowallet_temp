import { IsString } from "class-validator";

export class PinDto {
    
    @IsString()
    pin: string
}