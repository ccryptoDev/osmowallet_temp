import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { Coin } from 'src/entities/coin.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { User } from 'src/entities/user.entity';
import { CoinsModule } from '../coins/coins.module';
import { FundingModule } from '../funding/funding.module';
import { IbexModule } from '../ibex/ibex.module';
import { UsersModule } from '../users/users.module';
import { ReceiveController } from './receive.controller';
import { ReceiveService } from './receive.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, IbexAccount, HistoricRate, Coin]), IbexModule, FundingModule, UsersModule, CoinsModule],
    controllers: [ReceiveController],
    providers: [ReceiveService, MyLogger, EncrypterHelper],
    exports: [ReceiveService],
})
export class ReceiveModule {}
