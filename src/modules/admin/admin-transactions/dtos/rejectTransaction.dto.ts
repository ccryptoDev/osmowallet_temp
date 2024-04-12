import { IsOptional, IsString } from "class-validator";


export class RejectTransactionDto {
    @IsString()
    @IsOptional()
    note: string
}