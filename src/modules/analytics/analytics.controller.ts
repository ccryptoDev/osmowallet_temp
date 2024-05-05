import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Request } from 'express';
import { GetAnalyticsDto } from './dtos/analytics.dto';
import { AuthUser } from '../auth/payloads/auth.payload';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';

@UseGuards(AccessTokenGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService){}

    @Get()
    getAnalytics(@Req() req: Request, @Query() query: GetAnalyticsDto){

        return this.analyticsService.getAnalitycsByCoin(req.user as AuthUser,query)
    }

    @Get('/btc-history')
    getBtcBalanceHistory(@Req() req: Request){
        return this.analyticsService.getBtcBalanceHistory(req.user as AuthUser)
    }
}
