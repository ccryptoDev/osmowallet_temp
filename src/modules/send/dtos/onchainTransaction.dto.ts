import { IsNotEmpty, IsNumber } from "class-validator";
import { AuthUser } from "src/modules/auth/payloads/auth.payload";
import { SendDto } from "./send.dto";


export class CreateOnchainTransactionDto {

    @IsNumber()
    availableBalance: number

    @IsNotEmpty()
    user: AuthUser

    @IsNotEmpty()
    payload: SendDto
}