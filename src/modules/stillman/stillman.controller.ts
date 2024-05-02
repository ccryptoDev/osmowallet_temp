import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { StillmanService } from './stillman.service';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { WithdrawDto } from './dtos/Withdraw.dto';

@Controller('stillman')
export class StillmanController {
    constructor(private stillmanService: StillmanService) {}

    @UseGuards(AccessTokenGuard)
    @Post('/withdraw/create')
    withdrawInvoice(@Body() withdrawDto: WithdrawDto) {
        return this.stillmanService.createWithdraw(withdrawDto);
    }

    @UseGuards(AccessTokenGuard)
    @Get('/withdraw')
    withdrawGet(@Query('assetCode') assetCode: string) {
        return this.stillmanService.getWithdraw(assetCode);
    }
}
