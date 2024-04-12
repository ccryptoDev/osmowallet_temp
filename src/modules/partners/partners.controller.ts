import { Body, ClassSerializerInterceptor, Controller, Get, Post, Query, Req, UnauthorizedException, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { AuthDto } from '../auth/dto/auth.dto';
import { PartnerAccessTokenGuard } from '../auth/guards/partnerAccessToken.guard';
import { PartnerRefreshTokenGuard } from '../auth/guards/partnerRefreshToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { LightningInvoiceDto } from '../webhooks/dtos/receiveInvoice.dto';
import { PartnerGenerateInvoiceDto } from './dtos/generateInvoice.dto';
import { GetUserbyPhoneDto } from './dtos/getUser.dto';
import { ReceiveQueryDto } from './dtos/query.dto';
import { PartnersService } from './partners.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('partners')
export class PartnersController {

    constructor(private partnersService: PartnersService){}
    
    @Post('auth/signin')
    signin(@Body() data: AuthDto) {
        return this.partnersService.signIn(data);
    }

    @UseGuards(PartnerRefreshTokenGuard)
    @Post('auth/refresh-token')
    refreshToken(@Req() req: Request, @Body() data: AuthDto) {
        const refreshToken = req.user['refreshToken'];
        return this.partnersService.refreshToken(refreshToken,data);
    }

    @Post('/notify/pending')
    notifyPendingTransactions(@Req() req: Request) {
        if(req.headers.authorization !== process.env.GCLOUD_FUNCTIONS_API_KEY) throw new UnauthorizedException()
        this.partnersService.notifyPendingTransactions()
    }

    @UseGuards(PartnerAccessTokenGuard)
    @Get('/user')
    async getUsers(@Req() req: Request, @Query() params: GetUserbyPhoneDto){
        return this.partnersService.getUserbyPhone(params)
    }

    @UseGuards(PartnerAccessTokenGuard)
    @Post('/invoices')
    async generateInvoice(@Req() req: Request,@Body() data: PartnerGenerateInvoiceDto){
        return this.partnersService.generateInvoice(req.user as AuthUser,data)
    }

    @Post('/pay')
    async payInvoice(@Req() req: Request, @Body() data: LightningInvoiceDto, @Query() query: ReceiveQueryDto){
        if(data.webhookSecret !== process.env.IBEX_WEBHOOK_SECRET) throw new UnauthorizedException()
        return this.partnersService.pay(data,query)
    }
}
