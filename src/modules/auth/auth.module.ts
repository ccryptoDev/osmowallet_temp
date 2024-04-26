import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { AuthToken } from 'src/entities/auth.token.entity';
import { Account } from 'src/entities/account.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { Preference } from 'src/entities/preference.entity';
import { Coin } from 'src/entities/coin.entity';
import { Role } from 'src/entities/role.entity';
import { UserRole } from 'src/entities/roleUser.entity';
import { Period } from 'src/entities/period.entity';
import { Verification } from 'src/entities/verification.entity';
import { PushToken } from 'src/entities/push.token.entity';
import { Session } from 'src/entities/session.entity';
import { App } from 'src/entities/app.entity';
import { SessionLogoutAllTokenStrategy } from './strategies/sessionLogoutAllToken.strategy';
import { Otp } from 'src/entities/otp.entity';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { IbexModule } from '../ibex/ibex.module';
import { IbexToken } from 'src/entities/ibexToken.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { Address } from 'src/entities/address.entity';
import { GoogleCloudStorageService } from '../../services/google-cloud-storage/google-cloud-storage.service';
import { SendGridService } from '../send-grid/send-grid.service';
import { PartnerToken } from 'src/entities/partnerTokens.entity';
import { PartnerAccessTokenStrategy } from './strategies/partner.strategy';
import { PartnerRefreshTokenStrategy } from './strategies/partnerRefreshToken.strategy';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { PartnerRefreshTokenGuard } from './guards/partnerRefreshToken.guard';
import { ReferralModule } from '../referral/referral.module';
import { SmsService } from '../../services/sms/sms.service';
import { EmailableService } from '../../services/emailable/emailable.service';
import { Feature } from 'src/entities/feature.entity';
import { UsernameMsService } from '../username-ms/username-ms.service';
import { Tier } from 'src/entities/tier.entity';
import { TierUser } from 'src/entities/tierUser.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UsaUser, UsaUserSchema } from 'src/schemas/usaUser.schema';
import { AlgoliaService } from 'src/services/algolia/algolia.service';
import { CoinsModule } from '../coins/coins.module';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { UsersModule } from '../users/users.module';
import { KycModule } from '../kyc/kyc.module';
import { FundingMethod } from 'src/entities/fundingMethod.entity';
import { UserReferralSource } from 'src/entities/user.referral.source.entity';
import { ReferralSource } from 'src/entities/referral.source.entity';

@Module({
  imports: [JwtModule.register({}),
    MongooseModule.forFeature([
      {name: UsaUser.name, schema: UsaUserSchema}
    ]),
    TypeOrmModule.forFeature([
    User,
    Role,
    UserRole,
    AuthToken,
    Account,
    Wallet,
    Preference,
    Coin,
    Period,
    Verification,
    PushToken,
    Session,
    App,
    Otp,
    IbexToken,
    IbexAccount,
    Address,
    PartnerToken,
    Feature,
    Tier,
    TierUser,
    FundingMethod,
    UserReferralSource,
    ReferralSource
  ]),
  IbexModule,
  ReferralModule,
  CoinsModule,
  UsersModule,
  KycModule
],
  controllers: [AuthController],
  providers: [
    AccessTokenStrategy, 
    RefreshTokenStrategy,
    PartnerAccessTokenStrategy,
    PartnerRefreshTokenStrategy,
    RefreshTokenGuard,
    PartnerRefreshTokenGuard,
    AuthService, 
    SessionLogoutAllTokenStrategy,
    SendGridService,
    EncrypterHelper,
    GoogleCloudStorageService,
    SmsService,
    EmailableService,
    UsernameMsService,
    AlgoliaService,
    GoogleCloudTasksService
  ],
  exports: [TypeOrmModule,AuthService]
})
export class AuthModule {}
