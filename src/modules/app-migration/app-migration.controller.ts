import { Controller, Post } from '@nestjs/common';
import { AppMigrationService } from './app-migration.service';

@Controller('app-migration')
export class AppMigrationController {
    constructor(private appMigrationService: AppMigrationService) {}
    @Post("funding-transaction-limit")
    migrate() {
        return this.appMigrationService.completeFundingTransactionLimit()
    }
}
