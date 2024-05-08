import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomExceptionFilter } from './common/loggers/customException.filter';
import { EmailLogger } from './common/loggers/email.logger';
import { MyLogger } from './common/loggers/mylogger.logger';
import { SentryLogger } from './common/loggers/sentry.logger';
import { RedisService } from './common/services/redis/redis.service';
import typeorm from './config/typeorm';
import entitiesIndex from './entities/entitiesIndex';
import { GCPMiddleware } from './middlewares/gcp.middleware';
import { AdminModule } from './modules/admin/admin.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AppMigrationModule } from './modules/app-migration/app-migration.module';
import { AuthModule } from './modules/auth/auth.module';
import { AutoconvertModule } from './modules/autoconvert/autoconvert.module';
import { AutomationModule } from './modules/automation/automation.module';
import { BalanceUpdaterModule } from './modules/balance-updater/balance-updater.module';
import { BankModule } from './modules/banks/banks.module';
import { BillsModule } from './modules/bills/bills.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { CardModule } from './modules/card/card.module';
import { CoinsModule } from './modules/coins/coins.module';
import { CommercesModule } from './modules/commerces/commerces.module';
import { FeaturesModule } from './modules/features/features.module';
import { FundingModule } from './modules/funding/funding.module';
import { IbexModule } from './modules/ibex/ibex.module';
import { KycModule } from './modules/kyc/kyc.module';
import { MeModule } from './modules/me/me.module';
import { PartnersModule } from './modules/partners/partners.module';
import { PeriodsModule } from './modules/periods/periods.module';
import { PushNotificationModule } from './modules/push-notification/push-notification.module';
import { ReceiveModule } from './modules/receive/receive.module';
import { ReferralModule } from './modules/referral/referral.module';
import { SendGloballyModule } from './modules/send-globally/send-globally.module';
import { SendGridService } from './modules/send-grid/send-grid.service';
import { SendModule } from './modules/send/send.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SwapModule } from './modules/swap/swap.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { WithdrawModule } from './modules/withdraw/withdraw.module';
import { AlgoliaService } from './services/algolia/algolia.service';
import { GoogleCloudStorageService } from './services/google-cloud-storage/google-cloud-storage.service';
import { GoogleCloudTasksService } from './services/google-cloud-tasks/google-cloud-tasks.service';
import { OnvoService } from './services/onvo/onvo.service';
import { SmsService } from './services/sms/sms.service';
import { RidiviModule } from './services/ridivi/ridivi.module';
import { StillmanModule } from './modules/stillman/stillman.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.development',
            load: [typeorm],
        }),
        MongooseModule.forRoot(process.env.MONGO_URL_CONNECTION ?? '', {
            autoCreate: true,
            dbName: process.env.MONGO_DB_NAME,
        }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => configService.getOrThrow('typeorm'),
        }),
        TypeOrmModule.forFeature([...entitiesIndex]),
        AuthModule,
        IbexModule,
        BankModule,
        MeModule,
        TransactionsModule,
        UsersModule,
        CoinsModule,
        CommercesModule,
        WebhooksModule,
        PeriodsModule,
        PushNotificationModule,
        WithdrawModule,
        FundingModule,
        ReceiveModule,
        SendModule,
        SwapModule,
        ReferralModule,
        PartnersModule,
        AutoconvertModule,
        FeaturesModule,
        KycModule,
        PartnersModule,
        AnalyticsModule,
        BillsModule,
        AppMigrationModule,
        SettingsModule,
        BlockchainModule,
        SendGloballyModule,
        AdminModule,
        AutomationModule,
        BalanceUpdaterModule,
        WalletsModule,
        CardModule,
        RidiviModule,
        StillmanModule,
    ],
    providers: [
        AppService,
        GoogleCloudStorageService,
        SendGridService,
        {
            provide: APP_FILTER,
            useClass: CustomExceptionFilter,
        },
        GoogleCloudTasksService,
        SmsService,
        RedisService,
        MyLogger,
        EmailLogger,
        SentryLogger,
        OnvoService,
        AlgoliaService,
    ],
    controllers: [AppController],
    exports: [TypeOrmModule],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(GCPMiddleware)
            .forRoutes(
                '/swap/create',
                '/send/transactions/create',
                '/send/transactions/refund',
                '/ibex/autologin',
                '/coins/updateRates',
                '/kyc/country',
                '/swap/recurrent-buys/buy',
                '/swap/recurrent-buys/transactions-create',
                '/swap/recurrent-buys/process',
                '/transactions/amassed-amounts/reset',
                '/partners/notify/pending',
                { path: '/referral/check-referral-invitations', method: RequestMethod.POST },
                { path: '/automations/transactions-migrate', method: RequestMethod.POST },
                { path: '/ridivi/check-transfer-status', method: RequestMethod.POST },
                { path: '/ridivi/register-number', method: RequestMethod.POST },
                { path: '/ridivi/accounts', method: RequestMethod.POST },
                { path: '/kyc/:id/raw-kyc', method: RequestMethod.GET },
                { path: '/cashout/create-transaction', method: RequestMethod.POST },
                { path: '/commerces', method: RequestMethod.PUT },
                { path: '/swap/autoconvert', method: RequestMethod.POST },
                { path: '/swap/autoconvert-create', method: RequestMethod.POST },
                { path: '/automations/resign', method: RequestMethod.POST },
                { path: '/automations/monthly-report', method: RequestMethod.POST },
                { path: '/bank/generate-csv', method: RequestMethod.POST },
                { path: '/coins/historic-btc-price', method: RequestMethod.POST },
                { path: '/bills/send', method: RequestMethod.POST },
                { path: '/bills', method: RequestMethod.POST },
                { path: '/referral/refund', method: RequestMethod.POST },
                { path: '/send-globally', method: RequestMethod.POST },
                { path: '/automations/transactions/validated', method: RequestMethod.POST },
                { path: '/automations/stillman', method: RequestMethod.POST },
            );
    }
}
