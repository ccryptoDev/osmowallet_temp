import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { CoinsModule } from '../coins/coins.module';
import { WalletsController } from './wallets.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
    ]),
    CoinsModule,
  ],
  providers: [WalletsService],
  exports: [WalletsService],
  controllers: [WalletsController]
})
export class WalletsModule {}
