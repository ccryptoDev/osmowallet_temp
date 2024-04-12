import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionDetail } from 'src/entities/transaction.detail.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { Coin } from 'src/entities/coin.entity';
import { RecentContact } from 'src/entities/recent.contact.entity';
import { DynamicLinkHelper } from 'src/common/helpers/dynamicLink.helper';
import { IbexModule } from '../ibex/ibex.module';
import { JwtModule } from '@nestjs/jwt';
import { Period } from 'src/entities/period.entity';
import { RecurrentBuy } from 'src/entities/recurrent.buy.entity';
import { AutomaticBuy } from 'src/entities/automatic.buy.entity';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { GoogleCloudStorageService } from '../../services/google-cloud-storage/google-cloud-storage.service';
import { SendGridService } from '../send-grid/send-grid.service';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { UserTransactionLimit } from 'src/entities/userTransactionLimit.entity';
import { TransactionCategory } from 'src/entities/transactionCategory.entity';
import { PushNotificationModule } from '../push-notification/push-notification.module';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      User,
      Transaction,
      TransactionDetail,
      IbexAccount,
      Wallet,
      Coin,
      RecentContact,
      Period,
      RecurrentBuy,
      AutomaticBuy,
      TransactionGroup,
      UserTransactionLimit,
      TransactionCategory
    ]),
    PushNotificationModule,
    IbexModule,
  ],
  providers: [
    TransactionsService,
    DynamicLinkHelper,
    SendGridService,
    GoogleCloudStorageService,
    MyLogger
  ],
  controllers: [TransactionsController],
  exports: [
    TransactionsService,
  ]

})
export class TransactionsModule {}
