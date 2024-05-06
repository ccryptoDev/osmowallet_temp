import { Module } from '@nestjs/common';
import { BalanceUpdaterService } from './balance-updater.service';
import { BalanceUpdaterController } from './balance-updater.controller';
import { SolfinModule } from '../solfin/solfin.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { WalletsModule } from '../wallets/wallets.module';
import { CoinsModule } from '../coins/coins.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
    ]),
    SolfinModule,
    WalletsModule,
    CoinsModule
  ],
  providers: [BalanceUpdaterService],
  controllers: [BalanceUpdaterController]
})
export class BalanceUpdaterModule {}
