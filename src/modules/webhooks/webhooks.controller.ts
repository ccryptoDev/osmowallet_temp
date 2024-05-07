import { Body, Controller, Post, Req, Query } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { Request } from 'express';
import { LightningInvoiceDto } from './dtos/receiveInvoice.dto';
import { PayingInvoiceDto } from './dtos/payingInvoice.dto';
import { IbexPayingQueryDto } from './dtos/query.dto';
import { OnChainTransactionDto } from './dtos/onchain.dto';
import { CurrencyEnum } from '../ibex/enum/currencies.enum';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
    constructor(private webhookService: WebhooksService) {}

    @ApiOperation({ summary: 'Receive on-chain transaction' })
    @ApiBearerAuth()
    @Post('receive-onchain')
    receiveOnChain(@Req() req: Request, @Body() data: OnChainTransactionDto, @Query('currency') Currency: CurrencyEnum) {
        return this.webhookService.receiveOnChain(data, Currency);
    }

    @ApiOperation({ summary: 'Send on-chain transaction' })
    @ApiBearerAuth()
    @Post('send-onchain')
    sendOnChain(@Body() data: OnChainTransactionDto) {
        return this.webhookService.payingOnchain(data);
    }

    @ApiOperation({ summary: 'Pay Lightning invoice' })
    @ApiBearerAuth()
    @Post('pay-ln')
    payingLn(@Req() req: Request, @Body() data: PayingInvoiceDto, @Query() query: IbexPayingQueryDto) {
        return this.webhookService.payingInvoice(query, data);
    }

    @ApiOperation({ summary: 'Receive Lightning invoice' })
    @ApiBearerAuth()
    @Post('receive-ln')
    async receiveLn(@Body() data: LightningInvoiceDto) {
        await this.webhookService.storeLnReceivedMSat(data);
    }
}
