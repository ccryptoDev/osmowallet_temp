import { Module, Scope } from '@nestjs/common';
import { SendService } from './send.service';
import { SendController } from './send.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { IbexModule } from '../ibex/ibex.module';
import { JwtService } from '@nestjs/jwt';
import { Coin } from 'src/entities/coin.entity';
import { OsmoBusinessBpt } from 'src/entities/osmoBusinessBPT.entity';
import { SmsService } from '../../services/sms/sms.service';
import { RedisService } from 'src/common/services/redis/redis.service';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { Address } from 'src/entities/address.entity';
import { FeaturesModule } from '../features/features.module';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { Feature } from 'src/entities/feature.entity';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { SendGloballyModule } from '../send-globally/send-globally.module';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { EntityManager } from 'typeorm';
import { PushNotificationModule } from '../push-notification/push-notification.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { CoinsModule } from '../coins/coins.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      IbexAccount,
      Coin,
      OsmoBusinessBpt,
      TransactionGroup,
      HistoricRate,
      Feature,
      Address
    ]),
    IbexModule,
    PushNotificationModule,
    FeaturesModule,
    SendGloballyModule,
    TransactionsModule,
    CoinsModule
  ],
  providers: [
    SendService,
    JwtService,SmsService,
    GoogleCloudTasksService,
    RedisService,
    EncrypterHelper,
    {
      provide: 'REQUEST_SCOPED_ENTITY_MANAGER',
      scope: Scope.REQUEST,
      useFactory: (manager: EntityManager) => manager,
      inject: [EntityManager],
    }
  ],
  controllers: [SendController],
  exports: [SendService]
})
export class SendModule {}
