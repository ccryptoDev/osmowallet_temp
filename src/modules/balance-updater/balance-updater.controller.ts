import { Body, Controller, Post } from '@nestjs/common';
import { BalanceUpdaterService } from './balance-updater.service';
import { SyncBalance } from './interfaces/sync-balance';
import { UpdateBalance } from './interfaces/updateBalance';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('balance-updater')
@Controller('balance-updater')
export class BalanceUpdaterController {
    constructor(private balanceUpdaterService: BalanceUpdaterService) {}

    @ApiOperation({ summary: 'Sync balance' })
    @ApiBearerAuth()
    @Post('/sync')
    syncBalance(@Body() body: SyncBalance) {
        return this.balanceUpdaterService.syncBalance(body);
    }

    @ApiOperation({ summary: 'Update balance' })
    @ApiBearerAuth()
    @Post()
    updateBalance(@Body() body: UpdateBalance) {
        return this.balanceUpdaterService.updateBalance(body);
    }
}
