import { Module, Scope } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { RedisService } from 'src/common/services/redis/redis.service';
import { Address } from 'src/entities/address.entity';
import { Coin } from 'src/entities/coin.entity';
import { Feature } from 'src/entities/feature.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { OsmoBusinessBpt } from 'src/entities/osmoBusinessBPT.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { EntityManager } from 'typeorm';
import { SmsService } from '../../services/sms/sms.service';
import { CoinsModule } from '../coins/coins.module';
import { FeaturesModule } from '../features/features.module';
import { IbexModule } from '../ibex/ibex.module';
import { PushNotificationModule } from '../push-notification/push-notification.module';
import { SendGloballyModule } from '../send-globally/send-globally.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { SendController } from './send.controller';
import { SendService } from './send.service';
@Module({
    imports: [
        TypeOrmModule.forFeature([User, IbexAccount, Coin, OsmoBusinessBpt, TransactionGroup, HistoricRate, Feature, Address]),
        IbexModule,
        PushNotificationModule,
        FeaturesModule,
        SendGloballyModule,
        TransactionsModule,
        CoinsModule,
    ],
    providers: [
        SendService,
        JwtService,
        SmsService,
        GoogleCloudTasksService,
        RedisService,
        EncrypterHelper,
        {
            provide: 'REQUEST_SCOPED_ENTITY_MANAGER',
            scope: Scope.REQUEST,
            useFactory: (manager: EntityManager) => manager,
            inject: [EntityManager],
        },
    ],
    controllers: [SendController],
    exports: [SendService],
})
export class SendModule {}
