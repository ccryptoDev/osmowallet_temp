import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { SendGloballyAddressDto } from './dtos/send.dto';
import { SendGloballyService } from './send-globally.service';

@ApiTags('send-globally')
@Controller('send-globally')
export class SendGloballyController {
    constructor(private sendGloballyService: SendGloballyService) {}

    @ApiOperation({ summary: 'Send globally' })
    @ApiBearerAuth()
    @Post('')
    sendGloballyDto(@Body() body: SendGloballyAddressDto) {
        return this.sendGloballyService.managePayment(body);
    }

    @UseGuards(AccessTokenGuard)
    @ApiOperation({ summary: 'Get send globally countries' })
    @ApiBearerAuth()
    @Get('/countries')
    getSendGloballyCountries() {
        return this.sendGloballyService.getGlobalPaymentCountries();
    }
}
