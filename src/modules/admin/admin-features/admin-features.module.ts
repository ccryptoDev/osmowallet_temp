import { Module } from '@nestjs/common';
import { AdminFeaturesController } from './admin-features.controller';
import { AdminFeaturesService } from './admin-features.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TierFeature } from 'src/entities/tierFeature.entity';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { WithdrawalMethod } from 'src/entities/withdrawalMethod.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TierFeature,
      FundingMethod,
      WithdrawalMethod
    ])
  ],
  controllers: [AdminFeaturesController],
  providers: [AdminFeaturesService]
})
export class AdminFeaturesModule {}
