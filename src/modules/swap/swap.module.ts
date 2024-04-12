import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { Address } from 'src/entities/address.entity';
import { Coin } from 'src/entities/coin.entity';
import { Feature } from 'src/entities/feature.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { Period } from 'src/entities/period.entity';
import { RecurrentBuy } from 'src/entities/recurrent.buy.entity';
import { User } from 'src/entities/user.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { FeaturesModule } from '../features/features.module';
import { IbexModule } from '../ibex/ibex.module';
import { PushNotificationModule } from '../push-notification/push-notification.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { MongooseModule } from '@nestjs/mongoose';
import { Addresses, AddressesSchema } from 'src/schemas/addresses.schema';

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
    MongooseModule.forFeature([
      { name: Addresses.name, schema: AddressesSchema }
    ]),
    IbexModule,
    PushNotificationModule,
    FeaturesModule,
    TransactionsModule
  ],
  controllers: [SwapController],
  providers: [SwapService, MyLogger, GoogleCloudTasksService, EncrypterHelper],
  exports: [SwapService]
})
export class SwapModule { }
