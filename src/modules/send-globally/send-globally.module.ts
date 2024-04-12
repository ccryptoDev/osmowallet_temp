import { Module } from '@nestjs/common';
import { StrikeModule } from './strike/strike.module';
import { SendGloballyController } from './send-globally.controller';
import { SendGloballyService } from './send-globally.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalPaymentCountry } from 'src/entities/globalPaymentCountry.entity';
import { RelampagoModule } from './relampago/relampago.module';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { TheBitcoinCompanyModule } from './the-bitcoin-company/the-bitcoin-company.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GlobalPaymentCountry,
      GlobalPayment
    ]),
    StrikeModule,
    RelampagoModule,
    TheBitcoinCompanyModule
  ],
  controllers: [SendGloballyController],
  providers: [SendGloballyService]
})
export class SendGloballyModule {}
