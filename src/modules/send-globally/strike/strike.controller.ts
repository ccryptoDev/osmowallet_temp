import { Body, Controller, Delete, Get, Param, Post, RawBodyRequest, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { StrikeService } from './strike.service';
import { StrikeEventUpdate } from './interfaces/eventUpdate.interface';
import * as crypto from 'crypto';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { StrikeBankPaymentMethodDto } from './dtos/bankPaymentMethod.dto';
import {Request} from 'express'

import { AuthUser } from 'src/modules/auth/payloads/auth.payload';
import { CreateStrikeUserInvoiceDto } from './dtos/strikeUserInvoice.dto';
import { StrikeBankInvoiceDto } from './dtos/bankInvoice.dto';

@Controller('send-globally/strike')
export class StrikeController {

    constructor(private strikeService: StrikeService){}

    @Delete('/:id')
    deletePaymentMethod(@Param('id') id: string) {
        return this.strikeService.deleteBankPaymentMethod(id)
    }

    @UseGuards(AccessTokenGuard)
    @Post('/invoice/bank')
    createBankInvoice(@Body() body: StrikeBankInvoiceDto) {
        return this.strikeService.generateBankInvoice(body)
    }

    @UseGuards(AccessTokenGuard)
    @Get('/payment-methods')
    getBankPaymentMethods(@Req() req: Request) {
        return this.strikeService.getStrikeBankPaymentMethods(req.user as AuthUser)
    }

    @UseGuards(AccessTokenGuard)
    @Post('/payment-methods')
    createBankPaymentMethod(@Req() req: Request, @Body() body: StrikeBankPaymentMethodDto) {
        return this.strikeService.storeBankPaymentMethod(req.user as AuthUser,body)
    }

    @UseGuards(AccessTokenGuard)
    @Get('/rates')
    getRates() {
        return this.strikeService.getRates()
    } 

    @Post('/webhook')
    manageEvent(@Req() req: RawBodyRequest<Request>, @Body() data: StrikeEventUpdate){
        const isAuth = this.verifyRequestSignature(req)
        if(!isAuth) throw new UnauthorizedException()
        return this.strikeService.manageEvent(data)
    }

    @UseGuards(AccessTokenGuard)
    @Post('/invoice')
    createInvoice(@Req() req: Request, @Body() data: CreateStrikeUserInvoiceDto){
        return this.strikeService.generateInvoiceForStrikeUser(data)
    }
    
    @UseGuards(AccessTokenGuard)
    @Get('/user/:username')
    getStrikeUser(@Param('username') username: string){
        return this.strikeService.getUserByUsername(username)
    }


    private computeHmac(content, secret) {
        const hmac = crypto.createHmac('sha256', secret)
      
        return hmac.update(content).digest('hex')
    }
      
    private verifyRequestSignature(@Req() req: RawBodyRequest<Request>) {
        try{
            const requestSignature = req.headers['x-webhook-signature']
            if(!requestSignature) throw new UnauthorizedException()
            const requestSignatureBuffer = Buffer.from(requestSignature.toString(), 'utf8')
            const contentSignature = this.computeHmac(req.rawBody, process.env.STRIKE_OSMO_WEBHOOK_SECRET)
            const contentSignatureBuffer = Buffer.from(contentSignature.toUpperCase(), 'utf8')
            const isEqual = crypto.timingSafeEqual(requestSignatureBuffer, contentSignatureBuffer)
            return isEqual
        }catch(error){
            throw new UnauthorizedException()
        }
    }
}
