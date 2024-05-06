import { KycVerification } from "src/entities/kycVerification.entity"
import { SolfingKycFormData } from "./solfin.kyc.interface"



export interface Kyc {

    getForm(kycVerifcation?: KycVerification) : Promise<any>
    createForm(data?: SolfingKycFormData | any): Promise<any>
}