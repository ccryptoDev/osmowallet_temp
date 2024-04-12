import { IsArray, IsNotEmpty } from "class-validator";



export class CheckUserDto {
    
    @IsArray()
    @IsNotEmpty()
    phones: []
}