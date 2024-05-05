import { AuthUser } from "src/modules/auth/payloads/auth.payload";
import { SendDto } from "../dtos/send.dto";



export interface SendBtcData {
    authUser: AuthUser,
    payload: SendDto
}