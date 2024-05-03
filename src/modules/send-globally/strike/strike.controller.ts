import { Body, Controller, Delete, Get, Param, Post, RawBodyRequest, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import * as crypto from 'crypto';
import { Request } from 'express';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { AuthUser } from 'src/modules/auth/payloads/auth.payload';
import { StrikeBankInvoiceDto } from './dtos/bankInvoice.dto';
import { StrikeBankPaymentMethodDto } from './dtos/bankPaymentMethod.dto';
import { CreateStrikeUserInvoiceDto } from './dtos/strikeUserInvoice.dto';
import { StrikeEventUpdate } from './interfaces/eventUpdate.interface';
import { StrikeService } from './strike.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('send-globally/strike')
@ApiTags('send-globally/strike')
@ApiBearerAuth()
export class StrikeController {
    constructor(private strikeService: StrikeService) {}

    @Delete('/:id')
    @ApiOperation({ summary: 'Delete a payment method' })
    deletePaymentMethod(@Param('id') id: string) {
        return this.strikeService.deleteBankPaymentMethod(id);
    }

    @UseGuards(AccessTokenGuard)
    @Post('/invoice/bank')
    @ApiOperation({ summary: 'Create a bank invoice' })
    createBankInvoice(@Body() body: StrikeBankInvoiceDto) {
        return this.strikeService.generateBankInvoice(body);
    }

    @UseGuards(AccessTokenGuard)
    @Get('/payment-methods')
    @ApiOperation({ summary: 'Get bank payment methods' })
    getBankPaymentMethods(@Req() req: Request) {
        return this.strikeService.getStrikeBankPaymentMethods(req.user as AuthUser);
    }

    @UseGuards(AccessTokenGuard)
    @Post('/payment-methods')
    @ApiOperation({ summary: 'Create a bank payment method' })
    createBankPaymentMethod(@Req() req: Request, @Body() body: StrikeBankPaymentMethodDto) {
        return this.strikeService.storeBankPaymentMethod(req.user as AuthUser, body);
    }

    @UseGuards(AccessTokenGuard)
    @Get('/rates')
    @ApiOperation({ summary: 'Get rates' })
    getRates() {
        return this.strikeService.getRates();
    }

    @Post('/webhook')
    @ApiOperation({ summary: 'Manage webhook event' })
    manageEvent(@Req() req: RawBodyRequest<Request>, @Body() data: StrikeEventUpdate) {
        const isAuth = this.verifyRequestSignature(req);
        if (!isAuth) throw new UnauthorizedException();
        return this.strikeService.manageEvent(data);
    }

    @UseGuards(AccessTokenGuard)
    @Post('/invoice')
    @ApiOperation({ summary: 'Create an invoice' })
    createInvoice(@Req() req: Request, @Body() data: CreateStrikeUserInvoiceDto) {
        return this.strikeService.generateInvoiceForStrikeUser(data);
    }

    @UseGuards(AccessTokenGuard)
    @Get('/user/:username')
    @ApiOperation({ summary: 'Get a strike user' })
    getStrikeUser(@Param('username') username: string) {
        return this.strikeService.getUserByUsername(username);
    }

    private computeHmac(content: string, secret: string) {
        const hmac = crypto.createHmac('sha256', secret);

        return hmac.update(content).digest('hex');
    }

    private verifyRequestSignature(@Req() req: RawBodyRequest<Request>) {
        try {
            const requestSignature = req.headers['x-webhook-signature'];
            if (!requestSignature) throw new UnauthorizedException();
            const requestSignatureBuffer = Buffer.from(requestSignature.toString(), 'utf8');
            const contentSignature = this.computeHmac(req.rawBody, process.env.STRIKE_OSMO_WEBHOOK_SECRET ?? '');
            const contentSignatureBuffer = Buffer.from(contentSignature.toUpperCase(), 'utf8');
            const isEqual = crypto.timingSafeEqual(requestSignatureBuffer, contentSignatureBuffer);
            return isEqual;
        } catch (error) {
            throw new UnauthorizedException();
        }
    }
}
