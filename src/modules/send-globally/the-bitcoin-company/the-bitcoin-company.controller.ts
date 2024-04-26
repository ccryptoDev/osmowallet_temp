import { Body, Controller, Get, Post, Query, Req, Request, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { PayoutDTO, RefundDTO, UpdateInvoiceDTO } from './dtos';
import { Currencies } from './enums';
import { TheBitcoinCompanyService } from './the-bitcoin-company.service';

@Controller('send-globally/the-bitcoin-company')
export class TheBitcoinCompanyController {
    constructor(private theBitcoinCompanyService: TheBitcoinCompanyService){}

    @UseGuards(AccessTokenGuard)
    @Get('/options')
    getOptions(@Query('country') country: Currencies) {
        return this.theBitcoinCompanyService.getOptions(country)
    }

    @UseGuards(AccessTokenGuard)
    @Post('/invoice')
    generateInvoice(@Body() body: PayoutDTO) {
        return this.theBitcoinCompanyService.createInvoice(body)
    }

    @UseGuards(AccessTokenGuard)
    @Post('/refund')
    refundInvoice(@Body() refundDto: RefundDTO) {
        return this.theBitcoinCompanyService.refundInvoice(refundDto)
    }

    @Post('/webhook')
    updateInvoiceStatus(@Req() req: Request, @Body() body: UpdateInvoiceDTO){
        const webhookSecret = req.headers['x-webhook-secret']
        if(webhookSecret != process.env.THE_BITCOIN_COMPANY_WEBHOOK_SECRET) throw new UnauthorizedException()
        return this.theBitcoinCompanyService.manageEvent(body)
    }
}