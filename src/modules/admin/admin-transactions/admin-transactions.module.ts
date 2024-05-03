import { Module } from '@nestjs/common';
import { AdminTransactionsController } from './admin-transactions.controller';
import { AdminTransactionsService } from './admin-transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { SendGridService } from 'src/modules/send-grid/send-grid.service';
import { IbexModule } from 'src/modules/ibex/ibex.module';
import { ReferralModule } from 'src/modules/referral/referral.module';
import { Transaction } from 'src/entities/transaction.entity';
import { User } from 'src/entities/user.entity';
import { Coin } from 'src/entities/coin.entity';
import { Setting } from 'src/entities/setting.entity';
import { WalletHistory } from 'src/entities/walletHistory.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { PartnersModule } from 'src/modules/partners/partners.module';
import { PushNotificationModule } from 'src/modules/push-notification/push-notification.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([TransactionGroup, Transaction, User, Coin, Setting, WalletHistory]),
        IbexModule,
        ReferralModule,
        PartnersModule,
        PushNotificationModule,
    ],
    controllers: [AdminTransactionsController],
    providers: [AdminTransactionsService, SendGridService, GoogleCloudTasksService],
    exports: [AdminTransactionsService],
})
export class AdminTransactionsModule {}
