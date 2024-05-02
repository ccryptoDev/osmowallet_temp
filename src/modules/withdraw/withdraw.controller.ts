import { Body, ClassSerializerInterceptor, Controller, Get, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/common/decorators/user.decorator';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { CashoutWithdrawDto } from './dtos/cashoutWithdraw.dto';
import { WithdrawDto } from './dtos/withdraw.dto';
import { CashOutPayload } from './interfaces/cashout.payload';
import { WithdrawService } from './withdraw.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Withdraw')
@ApiBearerAuth()
@Controller('withdraw')
export class WithdrawController {
    constructor(private withdrawService: WithdrawService) {}

    @UseGuards(AccessTokenGuard)
    @Get('/ibex-rate')
    @ApiOperation({ summary: 'Get the IBEX to GTQ exchange rate' })
    getIbexGtqExchangeRate() {
        return this.withdrawService.getIbexGtqExchangeRate();
    }

    @UseGuards(AccessTokenGuard)
    @Get('/methods')
    @ApiOperation({ summary: 'Get the available withdrawal methods' })
    getWitdrawMethods(@Req() req: Request) {
        return this.withdrawService.getWithdrawMethods(req.user as AuthUser);
    }

    @UseGuards(AccessTokenGuard)
    @Post('/cashout')
    @ApiOperation({ summary: 'Withdraw funds in an agency' })
    withdrawInAgency(@User() user: AuthUser, @Body() data: CashoutWithdrawDto) {
        return this.withdrawService.withdrawInAgency(user.sub, data);
    }

    @Post('/cashout/create-transaction')
    @ApiOperation({ summary: 'Create a withdrawal transaction in an agency' })
    withdrawInAgencyCreateTransaction(@Req() req: Request, @Body() data: CashOutPayload) {
        return this.withdrawService.createWithdrawInAgencyTransaction(data);
    }

    @Post('/bank/generate-csv')
    @ApiOperation({ summary: 'Generate a CSV report for bank withdrawals' })
    withdrawBank() {
        return this.withdrawService.generateBankWithdrawReport();
    }

    @UseGuards(AccessTokenGuard)
    @Post('/')
    @ApiOperation({ summary: 'Withdraw funds' })
    withdraw(@Req() req: Request, @Body() body: WithdrawDto) {
        return this.withdrawService.withdraw(req.user as AuthUser, body);
    }
}
