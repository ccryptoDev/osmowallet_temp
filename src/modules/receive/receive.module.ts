import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { User } from 'src/entities/user.entity';
import { IbexModule } from '../ibex/ibex.module';
import { ReceiveController } from './receive.controller';
import { ReceiveService } from './receive.service';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { Coin } from 'src/entities/coin.entity';
import { FundingModule } from '../funding/funding.module';
import { UsersModule } from '../users/users.module';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      IbexAccount,
      HistoricRate,
      Coin,
    ]),
    IbexModule,
    FundingModule,
    UsersModule,
    CoinsModule,
  ],
  controllers: [ReceiveController],
  providers: [ReceiveService,MyLogger,EncrypterHelper],
  exports: [ReceiveService]
})
export class ReceiveModule {}
