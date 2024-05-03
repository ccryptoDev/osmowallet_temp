import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { RidiviModule } from 'src/services/ridivi/ridivi.module';
import { CoinsModule } from '../coins/coins.module';
import { WalletsModule } from '../wallets/wallets.module';
import { BalanceUpdaterController } from './balance-updater.controller';
import { BalanceUpdaterService } from './balance-updater.service';

@Module({
    imports: [TypeOrmModule.forFeature([User]), RidiviModule, WalletsModule, CoinsModule],
    providers: [BalanceUpdaterService],
    controllers: [BalanceUpdaterController],
})
export class BalanceUpdaterModule {}
