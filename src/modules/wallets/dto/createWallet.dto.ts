import { IsString } from "class-validator";



export class CreateWalletDto {
    @IsString()
    accountId!: string

    @IsString()
    alias!: string

    @IsString()
    blockchain!: string
    
}