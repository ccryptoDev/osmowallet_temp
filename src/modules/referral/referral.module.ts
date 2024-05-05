import { Module } from '@nestjs/common';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/entities/transaction.entity';
import { Referral } from 'src/entities/referral.entity';
import { User } from 'src/entities/user.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { MyLogger } from 'src/common/loggers/mylogger.logger';
import { SendGridService } from '../send-grid/send-grid.service';
import { IbexModule } from '../ibex/ibex.module';
import { SmsService } from '../../services/sms/sms.service';
import { Setting } from 'src/entities/setting.entity';
import { PartnersModule } from '../partners/partners.module';
import { Coin } from 'src/entities/coin.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { PartnerInvoice, PartnerInvoiceSchema } from 'src/schemas/partnerInvoice.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { App } from 'src/entities/app.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { PushNotificationModule } from '../push-notification/push-notification.module';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name: PartnerInvoice.name, schema: PartnerInvoiceSchema}
    ]),
    TypeOrmModule.forFeature([
      App,
      Transaction,
      Referral,
      User,
      Wallet,
      TransactionGroup,
      PartnerInvoice,
      Setting,
      Coin,
      IbexAccount,
    ]),
    IbexModule,
    PushNotificationModule,
    PartnersModule
  ],
  controllers: [ReferralController],
  providers: [
    ReferralService,
    SmsService,
    SendGridService,
    MyLogger,
    GoogleCloudTasksService
  ],
  exports: [ReferralService]
})
export class ReferralModule {}
