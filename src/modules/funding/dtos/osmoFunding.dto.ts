import { IsUUID } from "class-validator";


export class OsmoFundingDto {

    @IsUUID()
    bankId: string

}