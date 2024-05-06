import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { IbexModule } from '../ibex/ibex.module';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import { Coin } from 'src/entities/coin.entity';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { Period } from 'src/entities/period.entity';
import { RecurrentBuy } from 'src/entities/recurrent.buy.entity';
import { Feature } from 'src/entities/feature.entity';
import { FeaturesModule } from '../features/features.module';
import { Address } from 'src/entities/address.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { PushNotificationModule } from '../push-notification/push-notification.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Coin,
      Period,
      RecurrentBuy,
      Feature,
      Address,
      IbexAccount
    ]),
    IbexModule,
    PushNotificationModule,
    FeaturesModule,
    TransactionsModule
  ],
  controllers: [SwapController],
  providers: [SwapService,MyLogger,GoogleCloudTasksService],
  exports: [SwapService]
})
export class SwapModule {}
