import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { AuthUser } from '../auth/payloads/auth.payload';
import { AnalyticsService } from './analytics.service';
import { GetAnalyticsDto } from './dtos/analytics.dto';

@ApiTags('Analytics')
@UseGuards(AccessTokenGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) {}

    @ApiOperation({ summary: 'Get analytics' })
    @ApiBearerAuth()
    @Get()
    getAnalytics(@Req() req: Request, @Query() query: GetAnalyticsDto) {
        return this.analyticsService.getAnalitycsByCoin(req.user as AuthUser, query);
    }

    @ApiOperation({ summary: 'Get BTC balance history' })
    @ApiBearerAuth()
    @Get('/btc-history')
    getBtcBalanceHistory(@Req() req: Request) {
        return this.analyticsService.getBtcBalanceHistory(req.user as AuthUser);
    }
}
