import { IsMobileValid } from "src/common/dto_validators/mobile.validator";



export class OsmoReferralDto {
    
    @IsMobileValid({message: 'Este no es un número de teléfono válido'})
    phoneNumber: string
}