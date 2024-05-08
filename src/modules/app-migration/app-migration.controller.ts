import { Controller, Post } from '@nestjs/common';
import { AppMigrationService } from './app-migration.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('app-migration')
@ApiBearerAuth()
@Controller('app-migration')
export class AppMigrationController {
    constructor(private appMigrationService: AppMigrationService) {}

    @ApiOperation({ summary: 'text about the operation' })
    @Post('funding-transaction-limit')
    migrate() {
        return this.appMigrationService.completeFundingTransactionLimit();
    }
}
