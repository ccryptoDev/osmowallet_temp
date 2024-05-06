import { Body, Controller, Post } from '@nestjs/common';
import { TransactionsValidatedDto } from '../admin/admin-transactions/dtos/transactionsValidated.dto';
import { AutomationService } from './automation.service';
import { TransactionMigration } from './interfaces.ts/trans.interface';

@Controller('automations')
export class AutomationController {
    constructor(private automationService: AutomationService){}

    @Post('/transactions-migrate')
    migrateTransaction(@Body() data: TransactionMigration){
      return this.automationService.createOldTransaction(data)
    }

    @Post('/monthly-report')
    generateBalancesCopy() {
        return this.automationService.generateMonthlyBalancesCopy()
    }

    @Post('/resign')
    resign(){
      this.automationService.resign()
    }
  
    @Post('validated')
    async transactionsValidated(@Body() transactions: TransactionsValidatedDto) {
      return this.automationService.transactionsValidated(transactions);
    }
}
