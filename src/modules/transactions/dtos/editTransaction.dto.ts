import { IsOptional, IsString, IsUUID } from "class-validator";



export class EditTransactionDto {

    @IsUUID()
    @IsOptional()
    categoryId: string

    @IsString()
    @IsOptional()
    note: string
}