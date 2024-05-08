import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { Tier } from 'src/entities/tier.entity';
import { TierUser } from 'src/entities/tierUser.entity';
import { TiersController } from './tiers.controller';
import { TiersService } from './tiers.service';

@Module({
    imports: [TypeOrmModule.forFeature([Tier, TierUser])],
    controllers: [TiersController],
    providers: [TiersService, MyLogger],
    exports: [TiersService],
})
export class TiersModule {}
