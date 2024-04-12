import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminCoinsService } from './admin-coins.service';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';

@UseGuards(AdminAccessTokenGuard)
@Controller('admin/coins')
export class AdminCoinsController {
    constructor(private adminCoinService: AdminCoinsService){}

    @Get('/btc-price')
    getBtcPrice() {
        return this.adminCoinService.getBtcPrice()
    }

    @Get()
    getCoins(){
        return this.adminCoinService.getCoins()
    }
}
