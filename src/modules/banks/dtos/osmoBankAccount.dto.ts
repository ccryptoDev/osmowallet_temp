import { IsUUID } from "class-validator";


export class OsmoBankAccountQueryDto {

    @IsUUID()
    coinId: string
}