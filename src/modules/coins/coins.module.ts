import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coin } from 'src/entities/coin.entity';
import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { HistoricCoinRate } from 'src/entities/historicCoinRate.entity';
import { IbexModule } from '../ibex/ibex.module';
import { RedisService } from 'src/common/services/redis/redis.service';
import { CountryCoin } from 'src/entities/countryCoin.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    // MongooseModule.forFeature([
    //   {name: DailyHistoricBtcPrice.name, schema: DailyHistoricBtcPriceSchema},
    //   {name: EveryFiveMinutesHistoricBtcPrice.name, schema: EveryFiveMinutesHistoricBtcPriceSchema},
    //   {name: HourlyHistoricBtcPrice.name, schema: HourlyHistoricBtcPriceSchema}
    // ]),
    TypeOrmModule.forFeature([
      Coin,
      HistoricRate,
      HistoricCoinRate,
      CountryCoin,
    ]),
    IbexModule,
    UsersModule

  ],
  controllers: [CoinsController],
  providers: [CoinsService,RedisService],
  exports: [CoinsService]
})
export class CoinsModule {}
