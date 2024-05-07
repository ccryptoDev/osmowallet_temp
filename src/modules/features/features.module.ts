import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feature } from 'src/entities/feature.entity';
import { TierFeature } from 'src/entities/tierFeature.entity';
import { TierUser } from 'src/entities/tierUser.entity';
import { User } from 'src/entities/user.entity';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';
import { UserFeature } from 'src/entities/feat-user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Feature, User, TierFeature, TierUser,UserFeature])],
    controllers: [FeaturesController],
    providers: [FeaturesService],
    exports: [FeaturesService],
})
export class FeaturesModule {}
