import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/entities/transaction.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
    imports: [TypeOrmModule.forFeature([Transaction])],
    providers: [AnalyticsService],
    controllers: [AnalyticsController],
})
export class AnalyticsModule {}
