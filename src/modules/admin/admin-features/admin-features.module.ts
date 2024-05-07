import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { TierFeature } from 'src/entities/tierFeature.entity';
import { TierFunding } from 'src/entities/tierFunding.entity';
import { WithdrawalMethod } from 'src/entities/withdrawalMethod.entity';
import { AdminFeaturesController } from './admin-features.controller';
import { AdminFeaturesService } from './admin-features.service';
import { StillmanModule } from 'src/modules/stillman/stillman.module';
import { StillmanParams } from 'src/entities/stillman.entity';
import { PushNotificationModule } from 'src/modules/push-notification/push-notification.module';

@Module({
    imports: [TypeOrmModule.forFeature([TierFeature, 
        FundingMethod, 
        WithdrawalMethod, 
        TierFunding, 
        StillmanParams
    ]), 
    StillmanModule,   
     PushNotificationModule,],
    controllers: [AdminFeaturesController],
    providers: [AdminFeaturesService],
})
export class AdminFeaturesModule {}
