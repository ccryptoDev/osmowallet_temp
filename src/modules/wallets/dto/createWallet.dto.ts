import { IsString } from "class-validator";



export class CreateWalletDto {
    @IsString()
    user_id!: string

    @IsString()
    accountId!: string

    @IsString()
    alias!: string

    @IsString()
    blockchain!: string
    
}