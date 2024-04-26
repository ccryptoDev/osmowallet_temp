import { Controller,ClassSerializerInterceptor,UseGuards,UseInterceptors,Req,Param,Post,Get,Body,Query,Delete, UnauthorizedException } from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { Request } from 'express';
import { SendFiatDto } from './dtos/sendFiat.dto';
import { SendService } from './send.service';
import { EstimateBtcSendDto } from './dtos/estimate.dto';
import { SendDto } from './dtos/send.dto';
import { AuthUser } from '../auth/payloads/auth.payload';
import { CreateTransaction } from './dtos/transaction.dto';
import { RefundSendDto } from './dtos/refund.dto';
import { GenerateInvoiceFromEmail } from './dtos/generateInvoice.dto';


@UseInterceptors(ClassSerializerInterceptor)
@Controller('send')
export class SendController {

    constructor(private sendService: SendService){}

    @Post('/generate-invoice')
    generateInvoiceFromEmail(@Body() body: GenerateInvoiceFromEmail){
        return this.sendService.generateInvoiceFromEmail(body)
    }

    @Post('/transactions/create/v2')
    createTransactions(@Body() data: CreateTransaction) {
        return this.sendService.createTransactionsV2(data)
    }

    @Post('/transactions/refund')
    refundInvoiceTransaction(@Req() req: Request, @Body() data: RefundSendDto){
        return this.sendService.refundTransaction(data)
    }

    @UseGuards(AccessTokenGuard)
    @Get('/estimate-fee')
    estimateBtcSend(@Query() params: EstimateBtcSendDto){
        return this.sendService.estimateSend(params)
    }

    @UseGuards(AccessTokenGuard)
    @Post('/v2')
    send(@Req() req: Request, @Body() data: SendDto){
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.sendService.sendV2(authUser,data)
    }

    @UseGuards(AccessTokenGuard)
    @Post('/fiat')
    async sendFiat(@Req() req: Request,@Body() data: SendFiatDto){
        const authUser: AuthUser = {sub: req.user['sub']}
        return this.sendService.sendFiat(authUser, data)
    }




}
