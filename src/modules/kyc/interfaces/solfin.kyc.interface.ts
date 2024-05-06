import { AuthUser } from "src/modules/auth/payloads/auth.payload";
import { KycFormDto } from "../dtos/form.dto";


export interface SolfingKycFormData {
    authUser: AuthUser
    payload: KycFormDto
}