import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { StrikeBankPaymentMethodSchema } from 'src/schemas/strikeBankPaymentMethod.schema';
import { StrikeController } from './strike.controller';
import { StrikeService } from './strike.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'StrikeBankPaymentMethod', schema: StrikeBankPaymentMethodSchema }]),
        TypeOrmModule.forFeature([GlobalPayment]),
    ],
    providers: [StrikeService],
    controllers: [StrikeController],
    exports: [StrikeService],
})
export class StrikeModule {}
