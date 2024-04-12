import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { SendGloballyAddressDto } from './dtos/send.dto';
import { SendGloballyService } from './send-globally.service';

@Controller('send-globally')
export class SendGloballyController {
    constructor(private sendGloballyService: SendGloballyService){}

    @Post('')
    sendGloballyDto(@Body() body: SendGloballyAddressDto) {
        return this.sendGloballyService.managePayment(body)
    }

    @UseGuards(AccessTokenGuard)
    @Get('/countries')
    getSendGloballyCountries() {
        return this.sendGloballyService.getGlobalPaymentCountries()
    }
}
