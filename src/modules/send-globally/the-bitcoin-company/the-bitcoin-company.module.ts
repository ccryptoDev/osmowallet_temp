import { Module } from '@nestjs/common';
import { TheBitcoinCompanyService } from './the-bitcoin-company.service';
import { TheBitcoinCompanyController } from './the-bitcoin-company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GlobalPayment
    ]),
    HttpModule
  ],
  providers: [TheBitcoinCompanyService],
  controllers: [TheBitcoinCompanyController],
  exports: [TheBitcoinCompanyService]
})
export class TheBitcoinCompanyModule { }