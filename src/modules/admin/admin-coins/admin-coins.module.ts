import { Module } from '@nestjs/common';
import { AdminCoinsService } from './admin-coins.service';
import { AdminCoinsController } from './admin-coins.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coin } from 'src/entities/coin.entity';
import { IbexModule } from 'src/modules/ibex/ibex.module';

@Module({
    imports: [TypeOrmModule.forFeature([Coin]), IbexModule],
    providers: [AdminCoinsService],
    controllers: [AdminCoinsController],
})
export class AdminCoinsModule {}
