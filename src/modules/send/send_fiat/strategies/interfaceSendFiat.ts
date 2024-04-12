import { Transaction } from "src/entities/transaction.entity";
import { SendFiatDto } from "../../dtos/sendFiat.dto";

export interface SendFiat {    
    sendFiat() : Promise<Boolean>
}