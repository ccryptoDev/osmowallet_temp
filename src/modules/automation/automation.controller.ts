import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionsValidatedDto } from '../admin/admin-transactions/dtos/transactionsValidated.dto';
import { AutomationService } from './automation.service';
import { TransactionMigration } from './interfaces.ts/trans.interface';

@ApiTags('automations')
@Controller('automations')
export class AutomationController {
    constructor(private automationService: AutomationService) {}

    @ApiOperation({ summary: 'Migrate transaction' })
    @ApiBearerAuth()
    @Post('/transactions-migrate')
    migrateTransaction(@Body() data: TransactionMigration) {
        return this.automationService.createOldTransaction(data);
    }

    @ApiOperation({ summary: 'Generate monthly balances copy' })
    @ApiBearerAuth()
    @Post('/monthly-report')
    generateBalancesCopy() {
        return this.automationService.generateMonthlyBalancesCopy();
    }

    @ApiOperation({ summary: 'Resign' })
    @ApiBearerAuth()
    @Post('/resign')
    resign() {
        this.automationService.resign();
    }

    @ApiOperation({ summary: 'Transactions validated' })
    @ApiBearerAuth()
    @Post('/validated')
    async transactionsValidated(@Body() transactions: TransactionsValidatedDto) {
        return this.automationService.transactionsValidated(transactions);
    }


    @ApiOperation({ summary: 'Update wallet status' })
    @Patch('/status')
    updateWalletStatus() {
        return this.automationService.updateWalletStatus();
    }

    @Post('stillman')
    async stillmanWithdraw() {
        return this.automationService.stillmanInvoice();
    }


}
