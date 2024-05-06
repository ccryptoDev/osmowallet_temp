import { IsNotEmpty, IsString } from "class-validator";

export class EstimateScanToReceiveDto{
    
    @IsString()
    @IsNotEmpty()
    address: string

}