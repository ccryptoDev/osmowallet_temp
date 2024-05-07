import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { RelampagoQuoteDto } from './dtos/quote.dto';
import { UpdateRelampagoInvoiceDto } from './dtos/updateStatus.dto';
import { RelampagoCountry } from './enums/countries.enum';
import { RelampagoService } from './relampago.service';

@Controller('send-globally/relampago')
export class RelampagoController {
    constructor(private relampagoService: RelampagoService) {}

    @UseGuards(AccessTokenGuard)
    @Get('/banks/:countryCode')
    getBanks(@Param('countryCode') countryCode: RelampagoCountry = RelampagoCountry.MX) {
        return this.relampagoService.getBanks(countryCode);
    }

    @UseGuards(AccessTokenGuard)
    @Post('/invoice')
    generateInvoice(@Body() body: RelampagoQuoteDto) {
        return this.relampagoService.generateInvoice(body);
    }

    @Post('/webhook')
    updateInvoiceStatus(@Req() req: Request, @Body() body: UpdateRelampagoInvoiceDto) {
        const webhookSecret = req.headers['x-webhook-secret'];
        if (webhookSecret != process.env.RELAMPAGO_WEBHOOK_SECRET) throw new UnauthorizedException();
        return this.relampagoService.manageEvent(body);
    }
}
