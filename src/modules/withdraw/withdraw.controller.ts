import {
  Controller,
  ClassSerializerInterceptor,
  UseGuards,
  UseInterceptors,
  Req,
  Post,
  Body,
  Get,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { CashoutWithdrawDto } from './dtos/cashoutWithdraw.dto';
import { WithdrawService } from './withdraw.service';
import { Request } from 'express';
import { AuthUser } from '../auth/payloads/auth.payload';
import { CashOutPayload } from './interfaces/cashout.payload';
import { WithdrawDto } from './dtos/withdraw.dto';


@UseInterceptors(ClassSerializerInterceptor)
@Controller('withdraw')
export class WithdrawController {
  constructor(private withdrawService: WithdrawService) {}

  @UseGuards(AccessTokenGuard)
  @Get('/ibex-rate')
  getIbexGtqExchangeRate() {
    return this.withdrawService.getIbexGtqExchangeRate();
  }

  @UseGuards(AccessTokenGuard)
  @Get('/methods')
  getWitdrawMethods(@Req() req: Request) {
    return this.withdrawService.getWithdrawMethods(req.user as AuthUser);
  }

  @UseGuards(AccessTokenGuard)
  @Post('/cashout')
  withdrawInAgency(@Req() req: Request, @Body() data: CashoutWithdrawDto) {
    const userId = req.user['sub'];
    return this.withdrawService.withdrawInAgency(userId, data);
  }

  @Post('/cashout/create-transaction')
  withdrawInAgencyCreateTransaction(@Req() req: Request, @Body() data: CashOutPayload) {
    return this.withdrawService.createWithdrawInAgencyTransaction(data);
  }


  @Post('/bank/generate-csv')
  withdrawBank(){
    return this.withdrawService.generateBankWithdrawReport()
  }
  
  @UseGuards(AccessTokenGuard)
  @Post('/')
  withdraw(@Req() req: Request, @Body() body: WithdrawDto) {
    return this.withdrawService.withdraw(req.user as AuthUser, body)
  }
}
