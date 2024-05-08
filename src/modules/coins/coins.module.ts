import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from 'src/common/services/redis/redis.service';
import { Coin } from 'src/entities/coin.entity';
import { CountryCoin } from 'src/entities/countryCoin.entity';
import { HistoricCoinRate } from 'src/entities/historicCoinRate.entity';
import { HistoricRate } from 'src/entities/historicRates.entity';
import { IbexModule } from '../ibex/ibex.module';
import { UsersModule } from '../users/users.module';
import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';

@Module({
    imports: [TypeOrmModule.forFeature([Coin, HistoricRate, HistoricCoinRate, CountryCoin]), IbexModule, UsersModule],
    controllers: [CoinsController],
    providers: [CoinsService, RedisService],
    exports: [CoinsService],
})
export class CoinsModule {}
