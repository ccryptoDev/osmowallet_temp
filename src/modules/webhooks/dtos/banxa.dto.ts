import { IsNotEmpty } from "class-validator";

export class BanxaUpdateTransactioDto{

    @IsNotEmpty()
    order_id: string
}