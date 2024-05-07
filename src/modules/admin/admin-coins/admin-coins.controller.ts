import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminCoinsService } from './admin-coins.service';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin Coins')
@ApiBearerAuth()
@UseGuards(AdminAccessTokenGuard)
@Controller('admin/coins')
export class AdminCoinsController {
    constructor(private adminCoinService: AdminCoinsService) {}

    @ApiOperation({ summary: 'Get BTC price' })
    @Get('/btc-price')
    getBtcPrice() {
        return this.adminCoinService.getBtcPrice();
    }

    @ApiOperation({ summary: 'Get all coins' })
    @Get()
    getCoins() {
        return this.adminCoinService.getCoins();
    }
}
