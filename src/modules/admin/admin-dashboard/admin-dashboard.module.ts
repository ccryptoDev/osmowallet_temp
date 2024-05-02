import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { IbexModule } from 'src/modules/ibex/ibex.module';

@Module({
    imports: [TypeOrmModule.forFeature([Wallet]), IbexModule],
    controllers: [AdminDashboardController],
    providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
