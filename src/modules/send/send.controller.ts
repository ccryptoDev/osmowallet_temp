import { Body, ClassSerializerInterceptor, Controller, Get, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/common/decorators/user.decorator';
import EncrypterHelper from 'src/common/helpers/encrypter.helper';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { EstimateBtcSendDto } from './dtos/estimate.dto';
import { GenerateInvoiceFromEmail } from './dtos/generateInvoice.dto';
import { RefundSendDto } from './dtos/refund.dto';
import { SendDto, SendDtoV3 } from './dtos/send.dto';
import { SendFiatDto } from './dtos/sendFiat.dto';
import { CreateTransaction } from './dtos/transaction.dto';
import { SendService } from './send.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('send')
@Controller('send')
export class SendController {
    constructor(
        private sendService: SendService,
        private encrypterService: EncrypterHelper,
    ) {}

    @ApiOperation({ summary: 'Generate invoice from email' })
    @Post('/generate-invoice')
    generateInvoiceFromEmail(@Body() body: GenerateInvoiceFromEmail) {
        return this.sendService.generateInvoiceFromEmail(body);
    }

    @ApiOperation({ summary: 'Create transactions' })
    @Post('/transactions/create/v2')
    createTransactions(@Body() data: CreateTransaction) {
        return this.sendService.createTransactionsV2(data);
    }

    @ApiOperation({ summary: 'Refund invoice transaction' })
    @Post('/transactions/refund')
    refundInvoiceTransaction(@Req() req: Request, @Body() data: RefundSendDto) {
        return this.sendService.refundTransaction(data);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Estimate BTC send' })
    @Get('/estimate-fee')
    estimateBtcSend(@Query() params: EstimateBtcSendDto) {
        return this.sendService.estimateSend(params);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Send V2' })
    @ApiBearerAuth()
    @Post('/v2')
    async send(@User() user: AuthUser, @Body() data: SendDto) {
        return await this.sendService.sendV2(user, data);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Send V3' })
    @ApiBearerAuth()
    @Post('/v3')
    async sendv3(@User() user: AuthUser, @Body() data: SendDtoV3) {
        const rocketDecrypted = await this.encrypterService.decryptRocket(data.rocket);
        data.btcPrice = Number(rocketDecrypted);

        return this.sendService.sendV2(user, data);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Send fiat' })
    @ApiBearerAuth()
    @Post('/fiat')
    async sendFiat(@User() user: AuthUser, @Body() data: SendFiatDto) {
        return this.sendService.sendFiat(user, data);
    }
}
