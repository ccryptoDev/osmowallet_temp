import {
    Controller,
    Query,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    ClassSerializerInterceptor,
    ParseUUIDPipe,
    Put,
    Res,
    Patch,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { GetUserCSVDTO, GetUsersDto } from './dtos/getUsers.dto';
import { AdminAccessTokenGuard } from '../admin-auth/guards/accessToken.guard';
import { GetTransactionsDto } from 'src/modules/transactions/dtos/getTransaction.dto';
import { TransactionMetricDto } from './dtos/transactionMetric.dto';
import { UpdateUserTier } from './dtos/updateUserTier.dto';
import { TiersService } from 'src/modules/tiers/tiers.service';
import { Response } from 'express';
import { WalletsService } from 'src/modules/wallets/wallets.service';
import { UpdateUsersDto } from './dtos/updateUser.dto';

@UseGuards(AdminAccessTokenGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('admin/users')
export class AdminUsersController {
    constructor(
        private adminUsersService: AdminUsersService,
        private tierService: TiersService,
        private walletService: WalletsService,
    ) {}

    @Get('/wallets/summary')
    getWalletSummary() {
        return this.walletService.getSUMWalletUsers();
    }

    @Get('/raw')
    getAllRawUsers(@Res() response: Response, @Query() query: GetUserCSVDTO) {
        return this.adminUsersService.getUsersCSV(response, query);
    }

    @Put('/:id/tier')
    updateUserTier(@Param('id') id: string, @Body() body: UpdateUserTier) {
        return this.tierService.updateTierUser(id, body.tierId);
    }

    @Get('/:id/tier')
    getTierByUserId(@Param('id') id: string) {
        return this.tierService.getTierByUserId(id);
    }

    @Get('/tiers')
    getTiers() {
        return this.tierService.getTiers();
    }

    @Get('/:id/transaction-limits')
    getTransactionLimitsByUser(@Param('id') id: string) {
        return this.adminUsersService.getUserLimits(id);
    }

    @Get('/:id/metrics/transactions')
    getAllTransactionMetricsByUser(@Param('id') id: string, @Query() query: TransactionMetricDto) {
        query.userId = id;
        return this.adminUsersService.getTransactionMetrics(query);
    }

    @Get('/metrics/transactions')
    getAllTransactionMetrics(@Query() query: TransactionMetricDto) {
        return this.adminUsersService.getTransactionMetrics(query);
    }

    @Get('/:id/wallets')
    getWallets(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.walletService.getWalletsByUser(id);
    }

    @Get('/:id/transactions')
    getUserTransactions(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Query() query: GetTransactionsDto) {
        return this.adminUsersService.getTransactionsByUser(id, query);
    }

    @Get('/metrics')
    getUsersMetrics() {
        return this.adminUsersService.getUserMetrics();
    }

    @Post('/:id/email/resend-verification')
    resendEmailVerification(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.resendEmailVerification(id);
    }

    @Post('/:id/mobile/resend-verification')
    resendMobileVerification(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.resendMobileVerification(id);
    }

    @Get('/:id/kyc')
    getUserKyc(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.getKyc(id);
    }

    @Post('/:id/kyc/reject')
    forceRejectUserKyc(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.rejectKyc(id);
    }

    @Post('/:id/kyc/verify')
    forceVerifyUserKyc(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.forceVerifyKyc(id);
    }

    @Post('/:id/email/verify')
    forceVerifyUserEmail(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.forceVerifyEmail(id);
    }

    @Post('/:id/mobile/verify')
    forceVerifyUserMobile(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.forceVerifyMobile(id);
    }

    @Post('/:id/deactivate')
    deactivateUser(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.deactivateUser(id);
    }

    @Post('/:id/activate')
    activateUser(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.adminUsersService.activateUser(id);
    }

    @Get()
    getUsers(@Query() query: GetUsersDto) {
        return this.adminUsersService.getUsers(query);
    }

    @Patch(':id')
    updateUser(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() updateUsersDto: UpdateUsersDto) {
        return this.adminUsersService.updateUser(id, updateUsersDto);
    }
}
