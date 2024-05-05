import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionDetail } from 'src/entities/transaction.detail.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { WalletHistory } from 'src/entities/walletHistory.entity';
import { AlgoliaService } from 'src/services/algolia/algolia.service';
import { GoogleCloudStorageService } from 'src/services/google-cloud-storage/google-cloud-storage.service';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { SendGridService } from '../send-grid/send-grid.service';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { Coin } from 'src/entities/coin.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      WalletHistory,
      User,
      TransactionDetail,
      TransactionGroup,
      Coin,
      HistoricRate
    ]),
    UsersModule
  ],
  providers: [
    AutomationService,
    SendGridService,
    GoogleCloudStorageService,
    GoogleCloudTasksService,
  ],
  controllers: [AutomationController],
})
export class AutomationModule {}
