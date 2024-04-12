import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import entitiesIndex from 'src/entities/entitiesIndex';
import { TransactionsModule } from '../transactions/transactions.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { IbexModule } from '../ibex/ibex.module';
import { SwapModule } from '../swap/swap.module';
import { SendModule } from '../send/send.module';
import { FeaturesModule } from '../features/features.module';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { PushNotificationModule } from '../push-notification/push-notification.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      ...entitiesIndex
    ]),
    PushNotificationModule,
    TransactionsModule,
    IbexModule,
    SwapModule,
    SendModule,
    FeaturesModule,
  ],
  controllers: [WebhooksController],
  exports: [WebhooksService],
  providers: [
    WebhooksService,
    MyLogger,
    GoogleCloudTasksService
  ]
})
export class WebhooksModule {}
