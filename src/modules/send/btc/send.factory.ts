import { SendDto } from "../dtos/send.dto";
import { Lightning } from "./lightning.strategy";
import { SendBtc } from "./send.btc";
import { Lnurl } from "./lnurl.strategy";
import { Onchain } from "./onchain.strategy";
import { EntityManager } from "typeorm";
import { IbexService } from "src/modules/ibex/ibex.service";
import { FeaturesService } from "src/modules/features/features.service";
import { GoogleCloudTasksService } from "src/services/google-cloud-tasks/google-cloud-tasks.service";
import { CoinsService } from "src/modules/coins/coins.service";


export class SendFactory {

    public static getSendType(
            data: SendDto, 
            manager: EntityManager, 
            ibexService: IbexService, 
            coinService: CoinsService,
            featureService: FeaturesService,
            googleCloudTasksService: GoogleCloudTasksService
        ) : SendBtc {

        if (data.address.startsWith('lnurl')) return new Lnurl(ibexService,googleCloudTasksService,manager,coinService,featureService)
        if (data.address.startsWith('lnbc')) return new Lightning(ibexService,googleCloudTasksService,manager,coinService,featureService)
        return new Onchain(ibexService,googleCloudTasksService,manager,coinService,featureService)
        
    }
}