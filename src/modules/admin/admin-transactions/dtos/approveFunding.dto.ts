import { IsNumber, IsOptional, IsPositive, IsUrl } from "class-validator";



export class ApproveTransactionDto {
    
    @IsPositive()
    @IsNumber()
    @IsOptional()
    amount: number

    @IsUrl()
    @IsOptional()
    linkExplorer: string
}