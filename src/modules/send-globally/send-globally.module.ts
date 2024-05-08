import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { GlobalPaymentCountry } from 'src/entities/globalPaymentCountry.entity';
import { RelampagoModule } from './relampago/relampago.module';
import { SendGloballyController } from './send-globally.controller';
import { SendGloballyService } from './send-globally.service';
import { StrikeModule } from './strike/strike.module';
import { TheBitcoinCompanyModule } from './the-bitcoin-company/the-bitcoin-company.module';

@Module({
    imports: [TypeOrmModule.forFeature([GlobalPaymentCountry, GlobalPayment]), StrikeModule, RelampagoModule, TheBitcoinCompanyModule],
    controllers: [SendGloballyController],
    providers: [SendGloballyService],
})
export class SendGloballyModule {}
