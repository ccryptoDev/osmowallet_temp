import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/entities/transaction.entity';
import { TiersController } from './tiers.controller';
import { TiersService } from './tiers.service';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { TierUser } from 'src/entities/tierUser.entity';
import { Tier } from 'src/entities/tier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tier,TierUser])
  ],
  controllers: [TiersController],
  providers: [TiersService,MyLogger],
  exports: [TiersService]
})
export class TiersModule {}
