import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { Bank } from 'src/entities/bank.entity';
import { Coin } from 'src/entities/coin.entity';
import { CountryFunding } from 'src/entities/countryFunding.entity';
import { Feature } from 'src/entities/feature.entity';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { Setting } from 'src/entities/setting.entity';
import { TierFeature } from 'src/entities/tierFeature.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { UserTransactionLimit } from 'src/entities/userTransactionLimit.entity';
import { GoogleCloudStorageService } from '../../services/google-cloud-storage/google-cloud-storage.service';
import { OnvoService } from '../../services/onvo/onvo.service';
import { CardModule } from '../card/card.module';
import { FeaturesModule } from '../features/features.module';
import { IbexModule } from '../ibex/ibex.module';
import { SendGridService } from '../send-grid/send-grid.service';
import { SolfinModule } from '../solfin/solfin.module';
import { FundingController } from './funding.controller';
import { FundingService } from './funding.service';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { TierFunding } from 'src/entities/tierFunding.entity';
import { TierUser } from 'src/entities/tierUser.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      FundingMethod,
      Feature,
      TierFeature,
      UserTransactionLimit,
      CountryFunding,
      Coin,
      Bank,
      TransactionGroup,
      Transaction,
      Setting,
      TierFunding,
      TierUser
    ]),
    FeaturesModule,
    IbexModule,
    SolfinModule,
    CardModule,
  ],
  controllers: [FundingController],
  providers: [
    FundingService,
    GoogleCloudStorageService,
    GoogleCloudTasksService,
    MyLogger,
    SendGridService,
    OnvoService
  ],
  exports: [FundingService]
})
export class FundingModule {}
