import { IsNumber, IsOptional, IsPositive, IsUUID, MaxLength } from "class-validator";
import { IsMobileValid } from "src/common/dto_validators/mobile.validator";


export class SendFiatDto{

    @IsUUID()
    @IsOptional()
    receiverId: string

    @IsPositive()
    @IsNumber()
    amount: number

    @IsUUID()
    coinId: string

    @IsMobileValid({message: 'Este no es un número de teléfono válido'})
    @IsOptional()
    mobile: string
    
    @MaxLength(50, {
        message: 'La nota es muy larga!',
    })
    @IsOptional()
    note: string = null
}