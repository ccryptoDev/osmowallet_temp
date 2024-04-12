import { IsMobileValid } from "src/common/dto_validators/mobile.validator";

export class EditMobileDto {
    
    @IsMobileValid({message: 'Este no es un número de teléfono válido'})
    mobile: string
}