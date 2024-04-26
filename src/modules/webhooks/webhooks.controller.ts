import { Body, Controller, Post, Req, Query } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Request } from 'express';
import { LightningInvoiceDto } from './dtos/receiveInvoice.dto';
import { PayingInvoiceDto } from './dtos/payingInvoice.dto';
import { IbexPayingQueryDto } from './dtos/query.dto';
import { OnChainTransactionDto } from './dtos/onchain.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhookService: WebhooksService) {}

  @Post('receive-onchain')
  receiveOnChain(
    @Req() req: Request,
    @Body() data: OnChainTransactionDto,
  ) {
    return this.webhookService.receiveOnChain(data);
  }

  @Post('send-onchain')
  sendOnChain(@Body() data: OnChainTransactionDto,) {
    return this.webhookService.payingOnchain(data);
  }

  @Post('pay-ln')
  payingLn(@Req() req: Request,@Body() data: PayingInvoiceDto, @Query() query: IbexPayingQueryDto) {
    return this.webhookService.payingInvoice(query, data);
  }

  @Post('receive-ln')
  async receiveLn(@Body() data: LightningInvoiceDto) {
    await this.webhookService.storeLnReceivedMSat(data);
  }
}
