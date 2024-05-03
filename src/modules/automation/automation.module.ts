import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coin } from 'src/entities/coin.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { StillmanParams } from 'src/entities/stillman.entity';
import { TransactionDetail } from 'src/entities/transaction.detail.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { WalletHistory } from 'src/entities/walletHistory.entity';
import { GoogleCloudStorageService } from 'src/services/google-cloud-storage/google-cloud-storage.service';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { IbexModule } from '../ibex/ibex.module';
import { SendGridService } from '../send-grid/send-grid.service';
import { StillmanModule } from '../stillman/stillman.module';
import { UsersModule } from '../users/users.module';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { Transaction } from 'src/entities/transaction.entity';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([
            Wallet,
            WalletHistory,
            User,
            TransactionDetail,
            TransactionGroup,
            Transaction,
            Coin,
            HistoricRate,
            StillmanParams,
        ]),
        UsersModule,
        IbexModule,
        StillmanModule,
    ],
    providers: [AutomationService, SendGridService, GoogleCloudStorageService, GoogleCloudTasksService],
    controllers: [AutomationController],
})
export class AutomationModule {}
