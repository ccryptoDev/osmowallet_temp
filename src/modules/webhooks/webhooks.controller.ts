import { Body, Controller, Post, Req, Query } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Request } from 'express';
import { LightningInvoiceDto } from './dtos/receiveInvoice.dto';
import { PayingInvoiceDto } from './dtos/payingInvoice.dto';
import { IbexPayingQueryDto } from './dtos/query.dto';
import { OnChainTransactionDto } from './dtos/onchain.dto';
import { CurrencyEnum } from '../ibex/enum/currencies.enum';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhookService: WebhooksService) { }

  @Post('receive-onchain')
  receiveOnChain(
    @Req() req: Request,
    @Body() data: OnChainTransactionDto,
    @Query("currency") Currency: CurrencyEnum,
  ) {
    return this.webhookService.receiveOnChain(data, Currency);
  }

  @Post('send-onchain')
  sendOnChain(@Body() data: OnChainTransactionDto,) {
    return this.webhookService.payingOnchain(data);
  }

  @Post('pay-ln')
  payingLn(@Req() req: Request, @Body() data: PayingInvoiceDto, @Query() query: IbexPayingQueryDto) {
    return this.webhookService.payingInvoice(query, data);
  }

  @Post('receive-ln')
  async receiveLn(@Body() data: LightningInvoiceDto, @Query("currency") currency: CurrencyEnum) {
    await this.webhookService.storeLnReceivedMSat(data, currency);
  }
}
