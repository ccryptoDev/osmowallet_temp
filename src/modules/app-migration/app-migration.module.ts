import { Module } from '@nestjs/common';
import { AppMigrationService } from './app-migration.service';
import { AppMigrationController } from './app-migration.controller';
import { IbexModule } from '../ibex/ibex.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Coin } from 'src/entities/coin.entity';
import { Role } from 'src/entities/role.entity';
import { Feature } from 'src/entities/feature.entity';
import { Period } from 'src/entities/period.entity';
import { KycVerification } from 'src/entities/kycVerification.entity';
import { KycVerificationStep } from 'src/entities/kycVerificationStep.entity';
import { RecurrentBuy } from 'src/entities/recurrent.buy.entity';
import { Address } from 'src/entities/address.entity';
import { GoogleCloudStorageService } from '../../services/google-cloud-storage/google-cloud-storage.service';
import { OsmoBusinessBpt } from 'src/entities/osmoBusinessBPT.entity';
import { Tier } from 'src/entities/tier.entity';
import { UsernameMsService } from '../username-ms/username-ms.service';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { KycModule } from '../kyc/kyc.module';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { BankAccount } from 'src/entities/bank.account.entity';
import { FundingTransactionLimit } from 'src/entities/fundingTransactionLimits.entity';
import { FundingMethod } from 'src/entities/fundingMethod.entity';

@Module({
  imports: [
    IbexModule,
    TypeOrmModule.forFeature([
      User,
      FundingTransactionLimit,
      FundingMethod,
      Role,
      Coin,
      Feature,
      Period,
      KycVerification,
      KycVerificationStep,
      RecurrentBuy,
      Address,
      OsmoBusinessBpt,
      Tier,
      IbexAccount,
      HistoricRate,
      BankAccount
    ]),
    KycModule
  ],
  providers: [AppMigrationService, GoogleCloudStorageService,UsernameMsService,GoogleCloudTasksService],
  controllers: [AppMigrationController],
})
export class AppMigrationModule {}
