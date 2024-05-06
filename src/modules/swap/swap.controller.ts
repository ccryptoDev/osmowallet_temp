import {
  Controller,
  Req,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Delete,
  Get,
  Param,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { SwapDto } from './dtos/swap.dto';
import { SwapService } from './swap.service';
import { Request } from 'express';
import { AuthUser } from '../auth/payloads/auth.payload';
import { SwapTransactionDto } from './dtos/swapTransaction.dto';
import { RecurrentBuyDto } from './dtos/recurrentBuy.dto';
import { RecurrentBuyTransactionData } from './dtos/recurrentBuyTransactionData.dto';
import { RecurrentBuyPayload } from './dtos/recurrentBuyPayload.dto';
import { AutoconvertTransaction } from './interfaces/autoconvertTransaction.interface';
import { AutoConvertDto } from '../autoconvert/dtos/autoconvert.dto';
import { AutoconvertToReceivePayload } from './interfaces/autoconvert.interface';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('swap')
export class SwapController {
  constructor(private swapService: SwapService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async swap(@Req() req: Request, @Body() data: SwapDto) {
    return this.swapService.swap(req.user as AuthUser, data);
  }

  @Post('/autoconvert')
  async initAutoconvert(@Body() data: AutoconvertToReceivePayload) {
    return this.swapService.autoConvertToReceive(data);
  }

  @Post('/autoconvert-create')
  async createAutoconvert(@Body() data: AutoconvertTransaction) {
    return this.swapService.createAutoconvertToReceiveTransaction(data);
  }


  @Post('/create')
  async create(@Body() data: SwapTransactionDto) {
    return this.swapService.createTransactions(data);
  }

  @Delete('/recurrent-buys/:id')
  @UseGuards(AccessTokenGuard)
  deleteRecurrentBuy(@Req() req: Request, @Param() params) {
    const recurrentBuyId = params.id;
    return this.swapService.deleteRecurrentBuy(req.user as AuthUser, recurrentBuyId);
  }

  @Get('/recurrent-buys')
  @UseGuards(AccessTokenGuard)
  getRecurrentBuys(@Req() req: Request) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    return this.swapService.getRecurrentBuys(authUser);
  }

  @Post('/recurrent-buys')
  @UseGuards(AccessTokenGuard)
  createRecurrentBuy(@Req() req: Request, @Body() data: RecurrentBuyDto) {
    const authUser: AuthUser = {
      sub: req.user['sub'],
    };
    return this.swapService.createRecurrentBuy(authUser, data);
  }

  @Post('/recurrent-buys/process')
  buyRecurrentProcess() {
    return this.swapService.processRecurrentBuys();
  }

  @Post('/recurrent-buys/transactions-create')
  createRecurrentBuyTransactions(@Body() data: RecurrentBuyTransactionData) {
    this.swapService.createRecurrentBuyTransactions(data);
  }

  @Post('/recurrent-buys/buy')
  buyRecurrentBuy(@Body() data: RecurrentBuyPayload) {
    return this.swapService.buyRecurrentBuy(data);
  }
}
