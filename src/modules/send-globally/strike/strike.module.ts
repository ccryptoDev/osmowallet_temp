import { Module } from '@nestjs/common';
import { StrikeService } from './strike.service';
import { StrikeController } from './strike.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { StrikeBankPaymentMethodSchema } from 'src/schemas/strikeBankPaymentMethod.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'StrikeBankPaymentMethod', schema: StrikeBankPaymentMethodSchema }
    ]),
    TypeOrmModule.forFeature([
      GlobalPayment
    ])
  ],
  providers: [StrikeService],
  controllers: [StrikeController],
  exports: [StrikeService]
})
export class StrikeModule {}
