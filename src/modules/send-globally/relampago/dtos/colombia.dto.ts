import { IsEnum, IsString } from "class-validator"
import { ColombiaAccountType } from "../enums/colombiaAccountType.enum"



export class ColombiaQuoteDto {

    @IsString()
    documentId: string

    @IsEnum(ColombiaAccountType)
    documentType: ColombiaAccountType

    @IsString()
    name: string

    @IsString()
    lastName: string

    @IsEnum(ColombiaAccountType)
    accountType: ColombiaAccountType

    @IsString()
    accountNumber: string

    @IsString()
    institutionName: string
    
    @IsString()
    institutionCode: string
}