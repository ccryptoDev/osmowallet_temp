import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from 'src/entities/bank.account.entity';
import { Coin } from 'src/entities/coin.entity';
import { Feature } from 'src/entities/feature.entity';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { OsmoBankAccount } from 'src/entities/osmoBank.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { User } from 'src/entities/user.entity';
import { WithdrawalMethod } from 'src/entities/withdrawalMethod.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { CoinsModule } from '../coins/coins.module';
import { FeaturesModule } from '../features/features.module';
import { IbexModule } from '../ibex/ibex.module';
import { SendGridService } from '../send-grid/send-grid.service';
import { CsvWithdrawHelper } from './helpers/csvWithdraw.helper';
import { WithdrawController } from './withdraw.controller';
import { WithdrawService } from './withdraw.service';
import { PushNotificationModule } from '../push-notification/push-notification.module';
import { RidiviModule } from 'src/services/ridivi/ridivi.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Transaction, User, WithdrawalMethod, Feature, FundingMethod, Coin, OsmoBankAccount, BankAccount]),
        RidiviModule,
        IbexModule,
        FeaturesModule,
        CoinsModule,
        PushNotificationModule,
    ],
    providers: [WithdrawService, CsvWithdrawHelper, SendGridService, GoogleCloudTasksService],
    controllers: [WithdrawController],
    exports: [WithdrawService],
})
export class WithdrawModule {}
