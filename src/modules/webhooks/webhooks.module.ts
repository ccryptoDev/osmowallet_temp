import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import entitiesIndex from 'src/entities/entitiesIndex';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { FeaturesModule } from '../features/features.module';
import { IbexModule } from '../ibex/ibex.module';
import { PushNotificationModule } from '../push-notification/push-notification.module';
import { SendModule } from '../send/send.module';
import { SwapModule } from '../swap/swap.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([...entitiesIndex]),
        PushNotificationModule,
        TransactionsModule,
        IbexModule,
        SwapModule,
        SendModule,
        FeaturesModule,
    ],
    controllers: [WebhooksController],
    exports: [WebhooksService],
    providers: [WebhooksService, MyLogger, GoogleCloudTasksService],
})
export class WebhooksModule {}
