import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(AdminAccessTokenGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
    constructor(private adminDashboardService: AdminDashboardService) {}

    @ApiOperation({ summary: 'Get main balances' })
    @Get('/balances')
    getMainBalances() {
        return this.adminDashboardService.getMainBalances();
    }
}
