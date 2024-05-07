import { CoinsService } from 'src/modules/coins/coins.service';
import { FeaturesService } from 'src/modules/features/features.service';
import { IbexService } from 'src/modules/ibex/ibex.service';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { EntityManager } from 'typeorm';
import { SendDto } from '../dtos/send.dto';
import { Lightning } from './lightning.strategy';
import { Lnurl } from './lnurl.strategy';
import { Onchain } from './onchain.strategy';
import { SendBtc } from './send.btc';

export class SendFactory {
    public static getSendType(
        data: SendDto,
        manager: EntityManager,
        ibexService: IbexService,
        coinService: CoinsService,
        featureService: FeaturesService,
        googleCloudTasksService: GoogleCloudTasksService,
    ): SendBtc {
        if (data.address.startsWith('lnurl')) return new Lnurl(ibexService, googleCloudTasksService, manager, coinService, featureService);
        if (data.address.startsWith('lnbc'))
            return new Lightning(ibexService, googleCloudTasksService, manager, coinService, featureService);
        return new Onchain(ibexService, googleCloudTasksService, manager, coinService, featureService);
    }
}
