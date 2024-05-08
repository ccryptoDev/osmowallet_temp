import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { CreateRidiviAccount } from './interfaces/create-account';
import { RidiviService } from './ridivi.service';
import { CheckRidiviTransferStatusDto } from './dtos/check-transfer-status';
import { RidiviWebhookPayload } from './interfaces/webhook-payload';
import { Request } from 'express';
import { RegisterRidiviNumber } from './interfaces/register-number';

@Controller('ridivi')
export class RidiviController {
    constructor(private ridiviService: RidiviService) {}

    @Post('/register-number')
    registerNumber(@Body() body: RegisterRidiviNumber) {
        return this.ridiviService.registerPhoneNumber(body);
    }

    @Post('/accounts')
    createAccount(@Body() body: CreateRidiviAccount) {
        return this.ridiviService.createAccounts(body);
    }

    @Post('/check-transfer-status')
    checkTransferStatus(@Body() body: CheckRidiviTransferStatusDto) {
        return this.ridiviService.checkTransferStatus(body);
    }

    @Post('/webhook')
    manageEvent(@Body() body: RidiviWebhookPayload, @Req() req: Request) {
        this.validateEvent(req);
        return this.ridiviService.manageEvent(body);
    }

    private validateEvent(req: Request) {
        if (req.headers['x-api-key'] !== process.env.RIDIVI_WEBHOOK_SECRET) throw new UnauthorizedException();
    }
}
