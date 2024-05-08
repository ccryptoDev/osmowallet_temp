import { IsString } from "class-validator";



export class CreateWalletDto {

    @IsString()
    alias!: string

    @IsString()
    blockchain!: string
    
}