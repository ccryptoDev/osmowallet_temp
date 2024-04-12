import { IsEnum, IsInt, IsNotEmpty, IsString } from "class-validator";
import { RelampagoMethod } from "../enums/method.enum";

export class RecipientInfo {
    @IsString()
    beneficiary: string;

    @IsString()
    clabe: string;

    @IsString()
    institutionName: string;

    @IsString()
    institutionCode: string;

    @IsEnum(RelampagoMethod)
    method: RelampagoMethod;
}

export class RelampagoQuoteDto {
    @IsInt()
    satoshis: number;

    @IsNotEmpty()
    recipientInfo: any;
}

