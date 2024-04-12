import { Module } from '@nestjs/common';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { IbexModule } from '../ibex/ibex.module';
import { CoinsModule } from '../coins/coins.module';
import { PartnerConfig } from 'src/entities/strikeConfig.entity';
import { IbexAccount } from 'src/entities/ibex.account.entity';
import { Bank } from 'src/entities/bank.entity';
import { SendGridService } from '../send-grid/send-grid.service';
import { SmsService } from '../../services/sms/sms.service';
import { App } from 'src/entities/app.entity';
import { PartnerToken } from 'src/entities/partnerTokens.entity';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { JwtService } from '@nestjs/jwt';
import { TierFeature } from 'src/entities/tierFeature.entity';
import { Feature } from 'src/entities/feature.entity';
import { Coin } from 'src/entities/coin.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { PartnerInvoice, PartnerInvoiceSchema } from 'src/schemas/partnerInvoice.schema';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';
import { CashInOutModule } from './cash-in-out/cash-in-out.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: PartnerInvoice.name, schema: PartnerInvoiceSchema}
    ]),
    TypeOrmModule.forFeature([
      User,
      Bank,
      IbexAccount,
      PartnerConfig,
      App,
      PartnerToken,
      TierFeature,
      Feature,
      Coin,
    ]),
    IbexModule,
    CoinsModule,
    CashInOutModule,
  ],
  controllers: [PartnersController],
  providers: [
    PartnersService,
    GoogleCloudTasksService,
    SendGridService,
    SmsService,
    EncrypterHelper,
    JwtService,
  ],
  exports: [PartnersService]
})
export class PartnersModule {}
