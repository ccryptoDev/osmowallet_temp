import { Controller,ClassSerializerInterceptor,UseGuards,UseInterceptors,Post,Get, Req } from '@nestjs/common';
import { AccessTokenGuard } from 'src/modules/auth/guards/accessToken.guard';
import { CoinsService } from './coins.service';
import { UsersService } from '../users/users.service';
import { Request } from 'express';

@Controller('coins')
export class CoinsController {
    constructor(
        private coinService: CoinsService,
        private userService: UsersService
    ){}

    // @UseGuards(AccessTokenGuard)
    // @Get('/historic-btc-price')
    // getHistoricBtcPrice(@Query() data: GetHistoricBtcPriceDto) {
    //     switch(data.period){
    //         case(GetHistoricBtcPriceType.DAILY):
    //         return this.coinService.getDailyHistoricBtcPrice()
    //         case(GetHistoricBtcPriceType.WEEKLY):
    //         return this.coinService.getWeeklyHistoricBtcPrice()
    //         case(GetHistoricBtcPriceType.MONTHLY):
    //         return this.coinService.getMonthlyHistoricBtcPrice()
    //         case(GetHistoricBtcPriceType.YEARLY):
    //         return this.coinService.getYearlyHistoricBtcPrice()
    //     }
        
    // }

    // @Post('/historic-btc-price')
    // updateHistoricBtcPrice(@Body() data: UpdateHistoricBtcPriceDto){
    //     switch(data.type){
    //         case(UpdateHistoricBtcPriceType.FIVE_MINUTES):
    //         return this.coinService.updateFiveMinutesHistoricBtcPrice();
    //         case(UpdateHistoricBtcPriceType.HOURLY):
    //         return this.coinService.updateHourlyHistoricBtcPrice();
    //         case(UpdateHistoricBtcPriceType.DAILY):
    //         return this.coinService.updateDailyHistoricBtcPrice();
    //     }
    // }

    @UseGuards(AccessTokenGuard)
    @Get('/country')
    async getCoinsByCountry(@Req() req: Request){
        
        const user = await this.userService.getUserById(req.user['sub'])
        return this.coinService.getCoinsByResidence(user.residence)
    }

    @Post('/updateRates')
    updateRates(){
        return this.coinService.updateExchangesRates()
    }

    //@UseGuards(AccessTokenGuard)
    @UseInterceptors(ClassSerializerInterceptor)
    @Get()
    async getCoins(){
        return this.coinService.getAll()
    }

    @UseGuards(AccessTokenGuard)
    @Get('/btc-price')
    async getBtcPrice(){
        return this.coinService.getBtcPrice()
    }
}
