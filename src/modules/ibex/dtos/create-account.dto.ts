import { IsUUID } from "class-validator";

export class CreateIbexAccountDto {
    @IsUUID()
    userId: string
}