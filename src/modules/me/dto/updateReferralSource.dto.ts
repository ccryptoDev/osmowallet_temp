import { IsString } from "class-validator";

export class UpdateReferralSourceDto {

    @IsString()
    referralSourceIds: string[]
}