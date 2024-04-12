import { IsUUID } from "class-validator";

export class CreateIbexAddressesDto {

    @IsUUID()
    ibexAccountId: string
}