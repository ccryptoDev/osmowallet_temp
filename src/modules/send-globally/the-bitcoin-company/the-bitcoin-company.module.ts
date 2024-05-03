import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalPayment } from 'src/entities/globalPayment.entity';
import { TheBitcoinCompanyController } from './the-bitcoin-company.controller';
import { TheBitcoinCompanyService } from './the-bitcoin-company.service';

@Module({
    imports: [TypeOrmModule.forFeature([GlobalPayment]), HttpModule],
    providers: [TheBitcoinCompanyService],
    controllers: [TheBitcoinCompanyController],
    exports: [TheBitcoinCompanyService],
})
export class TheBitcoinCompanyModule {}
