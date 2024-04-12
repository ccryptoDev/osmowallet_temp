import { IsString, IsUUID } from "class-validator";

export class ReceiveQueryDto {

    @IsUUID()
    userId: string

    @IsString()
    referenceId: string
}