import { Module } from '@nestjs/common';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nit } from 'src/entities/bill.entity';
import { InfileService } from '../../services/infile/infile.service';
import { Transaction } from 'src/entities/transaction.entity';
import { TransactionGroup } from 'src/entities/transactionGroup.entity';
import { Wallet } from 'src/entities/wallet.entity';
import { GoogleCloudTasksService } from 'src/services/google-cloud-tasks/google-cloud-tasks.service';

@Module({
    imports: [TypeOrmModule.forFeature([Nit, Transaction, TransactionGroup, Wallet])],
    controllers: [BillsController],
    providers: [BillsService, InfileService, GoogleCloudTasksService],
})
export class BillsModule {}
