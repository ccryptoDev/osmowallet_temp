import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from 'src/common/services/redis/redis.service';
import { Country } from 'src/entities/country.entity';
import { KycVerification } from 'src/entities/kycVerification.entity';
import { KycVerificationStep } from 'src/entities/kycVerificationStep.entity';
import { User } from 'src/entities/user.entity';
import { Verification } from 'src/entities/verification.entity';
import { KycPartnerStatus, KycPartnerStatusSchema } from 'src/schemas/kyc.schema';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { PushNotificationModule } from '../push-notification/push-notification.module';
import { UsersModule } from '../users/users.module';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: KycPartnerStatus.name, schema: KycPartnerStatusSchema }]),
        TypeOrmModule.forFeature([KycVerification, KycVerificationStep, User, Country, Verification]),
        PushNotificationModule,
        UsersModule,
    ],
    controllers: [KycController],
    providers: [KycService, GoogleCloudTasksService, RedisService],
    exports: [KycService],
})
export class KycModule {}
