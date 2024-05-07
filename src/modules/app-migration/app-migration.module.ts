import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from 'src/entities/address.entity';
import { BankAccount } from 'src/entities/bank.account.entity';
import { Coin } from 'src/entities/coin.entity';
import { Feature } from 'src/entities/feature.entity';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { FundingTransactionLimit } from 'src/entities/fundingTransactionLimits.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { KycVerification } from 'src/entities/kycVerification.entity';
import { KycVerificationStep } from 'src/entities/kycVerificationStep.entity';
import { OsmoBusinessBpt } from 'src/entities/osmoBusinessBPT.entity';
import { Period } from 'src/entities/period.entity';
import { RecurrentBuy } from 'src/entities/recurrent.buy.entity';
import { Role } from 'src/entities/role.entity';
import { Tier } from 'src/entities/tier.entity';
import { User } from 'src/entities/user.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { GoogleCloudStorageService } from '../../services/google-cloud-storage/google-cloud-storage.service';
import { IbexModule } from '../ibex/ibex.module';
import { KycModule } from '../kyc/kyc.module';
import { UsernameMsService } from '../username-ms/username-ms.service';
import { AppMigrationController } from './app-migration.controller';
import { AppMigrationService } from './app-migration.service';

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
            BankAccount,
        ]),
        KycModule,
    ],
    providers: [AppMigrationService, GoogleCloudStorageService, UsernameMsService, GoogleCloudTasksService],
    controllers: [AppMigrationController],
})
export class AppMigrationModule {}
