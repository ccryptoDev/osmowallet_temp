import { IsUUID } from "class-validator";


export class UpdateUserTier {

    @IsUUID()
    tierId: string
}