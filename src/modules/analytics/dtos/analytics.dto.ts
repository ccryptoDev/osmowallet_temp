import { IsUUID } from "class-validator";


export class GetAnalyticsDto {

    @IsUUID()
    coinId: string
}