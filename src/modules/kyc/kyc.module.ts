import { Module, forwardRef } from '@nestjs/common';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycVerification } from 'src/entities/kycVerification.entity';
import { KycVerificationStep } from 'src/entities/kycVerificationStep.entity';
import { User } from 'src/entities/user.entity';
import { Country } from 'src/entities/country.entity';
import { Verification } from 'src/entities/verification.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { MongooseModule } from '@nestjs/mongoose';
import { KycPartnerStatus, KycPartnerStatusSchema } from 'src/schemas/kyc.schema';
import { PushNotificationModule } from '../push-notification/push-notification.module';
import { SolfinModule } from '../solfin/solfin.module';
import { UsersModule } from '../users/users.module';
import { RedisService } from 'src/common/services/redis/redis.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: KycPartnerStatus.name, schema: KycPartnerStatusSchema}
    ]),
    TypeOrmModule.forFeature([
      KycVerification,
      KycVerificationStep,
      User,
      Country,
      Verification
    ]),
    PushNotificationModule,
    UsersModule,
    forwardRef(() => SolfinModule)
  ],
  controllers: [KycController],
  providers: [KycService,GoogleCloudTasksService,RedisService],
  exports: [KycService]
})
export class KycModule {}
