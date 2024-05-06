import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';

@UseGuards(AdminAccessTokenGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
    constructor(
        private adminDashboardService: AdminDashboardService
    ){}

    @Get('/balances')
    getMainBalances() {
        return this.adminDashboardService.getMainBalances()
    }
}
