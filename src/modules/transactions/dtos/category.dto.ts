import { IsHexColor, IsInt, IsString } from "class-validator";


export class CreateTransactionCategoryDto {
    
    @IsString()
    name: string

    @IsInt()
    icon: number

    @IsHexColor()
    color: string
}