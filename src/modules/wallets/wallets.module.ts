import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { CoinsModule } from '../coins/coins.module';
import { WalletsController } from './wallets.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    CoinsModule,
  ],
  providers: [WalletsService],
  exports: [WalletsService],
  controllers: [WalletsController]
})
export class WalletsModule {}
